import { describe, expect, it } from "vitest";
import { makeDiamondGraph, makeForkGraph, makeLineGraph } from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import { makeBuildState } from "@/domain/build/__tests__/BuildState.fixtures.ts";
import { AllocationStateEngine } from "../AllocationState";

describe("AllocationStateEngine.compute", () => {
  describe("line graph", () => {
    it("includes every node in nodeStateById", () => {
      const { graph } = makeLineGraph();
      const buildState = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = AllocationStateEngine.compute(graph, buildState);

      expect(result.nodeStateById.size).toBe(graph.nodesById.size);
      for (const nodeId of graph.nodesById.keys()) {
        expect(result.nodeStateById.has(nodeId)).toBe(true);
      }
    });

    it("marks the start node as non-allocatable (forbidden kind)", () => {
      const { graph, nodes } = makeLineGraph();
      const buildState = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = AllocationStateEngine.compute(graph, buildState);

      expect(result.nodeStateById.get(nodes.start.id)!.allocatable).toBe(false);
      // Start node is a BFS root so it is reachable, but forbidden to allocate
      expect(result.nodeStateById.get(nodes.start.id)!.reachable).toBe(true);
    });

    it("marks reachable non-start nodes as allocatable when budget allows", () => {
      const { graph, nodes } = makeLineGraph();
      const buildState = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = AllocationStateEngine.compute(graph, buildState);

      expect(result.nodeStateById.get(nodes.first.id)!.allocatable).toBe(true);
      expect(result.nodeStateById.get(nodes.first.id)!.reachable).toBe(true);
      expect(result.nodeStateById.get(nodes.third.id)!.allocatable).toBe(true);
      expect(result.nodeStateById.get(nodes.third.id)!.reachable).toBe(true);
    });

    it("records cheapest path cost as number of unallocated nodes on path", () => {
      const { graph, nodes } = makeLineGraph();
      const buildState = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = AllocationStateEngine.compute(graph, buildState);

      // First node: path is [start, first] — start is free, first costs 1
      expect(result.nodeStateById.get(nodes.first.id)!.cheapestPathCost).toBe(1);
      // Third node: path is [start, 1, 2, 3] — start is free, 1+2+3 cost 3
      expect(result.nodeStateById.get(nodes.third.id)!.cheapestPathCost).toBe(3);
    });

    it("marks already-allocated nodes with correct state", () => {
      const { graph, nodes } = makeLineGraph();
      const buildState = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.first.id, nodes.second.id]),
      });

      const result = AllocationStateEngine.compute(graph, buildState);

      expect(result.nodeStateById.get(nodes.first.id)!.allocated).toBe(true);
      expect(result.nodeStateById.get(nodes.first.id)!.cheapestPathCost).toBe(0);
      expect(result.nodeStateById.get(nodes.second.id)!.allocated).toBe(true);
      expect(result.nodeStateById.get(nodes.second.id)!.cheapestPathCost).toBe(0);
    });
  });

  describe("diamond graph", () => {
    it("chooses shorter path when both paths unallocated", () => {
      const { graph } = makeDiamondGraph();
      const buildState = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = AllocationStateEngine.compute(graph, buildState);
      const endNode = result.nodeStateById.get("end")!;

      // Shorter path: start → left-1 → end (cost = 2)
      // Longer path: start → right-1 → right-2 → end (cost = 3)
      expect(endNode.cheapestPathCost).toBe(2);
      expect(endNode.cheapestPath).toEqual(["start", "left-1", "end"]);
    });

    it("prefers path through allocated nodes even if longer in hops", () => {
      const { graph } = makeDiamondGraph();
      const nodes = graph.nodesById;
      const rightFirst = [...nodes.values()].find((n) => n.id === "right-1")!;
      const rightSecond = [...nodes.values()].find((n) => n.id === "right-2")!;

      const buildState = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([rightFirst.id, rightSecond.id]),
      });

      const result = AllocationStateEngine.compute(graph, buildState);
      const endNode = result.nodeStateById.get("end")!;

      // Path through allocated nodes: start → right-1 → right-2 → end
      // Cost = 1 (only 'end' is unallocated on this path)
      expect(endNode.cheapestPathCost).toBe(1);
    });

    it("computes dependencies: end does not depend on either parent in diamond", () => {
      const { graph } = makeDiamondGraph();
      const buildState = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = AllocationStateEngine.compute(graph, buildState);
      const endNode = result.nodeStateById.get("end")!;

      // In a diamond, removing either parent still leaves a path to end
      // So end depends on neither left-1 nor right-1
      expect(endNode.dependsOn.has("left-1")).toBe(false);
      expect(endNode.dependsOn.has("right-1")).toBe(false);
    });
  });

  describe("fork graph", () => {
    it("marks branching node as required by both branch leaves", () => {
      const { graph } = makeForkGraph();
      const buildState = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set(["1", "left-1", "left-2", "right-1", "right-2"]),
      });

      const result = AllocationStateEngine.compute(graph, buildState);
      const first = result.nodeStateById.get("1")!;

      // Both left-2 and right-2 depend on '1' (the branching node)
      expect(first.requiredBy.has("left-2")).toBe(true);
      expect(first.requiredBy.has("right-2")).toBe(true);
    });

    it("marks leaf nodes as depending on the branching node", () => {
      const { graph } = makeForkGraph();
      const buildState = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set(["1", "left-1", "left-2", "right-1", "right-2"]),
      });

      const result = AllocationStateEngine.compute(graph, buildState);
      const leftSecond = result.nodeStateById.get("left-2")!;

      // left-2 depends on '1' (removing '1' makes left-2 unreachable)
      expect(leftSecond.dependsOn.has("1")).toBe(true);
    });
  });

  describe("allocatableNodeIds", () => {
    it("contains only allocatable nodes", () => {
      const { graph, nodes } = makeLineGraph();
      const buildState = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = AllocationStateEngine.compute(graph, buildState);

      expect(result.allocatableNodeIds.has(nodes.start.id)).toBe(false); // forbidden
      expect(result.allocatableNodeIds.has(nodes.first.id)).toBe(true);
      expect(result.allocatableNodeIds.has(nodes.third.id)).toBe(true);
    });

    it("excludes allocated nodes from allocatable set", () => {
      const { graph, nodes } = makeLineGraph();
      const buildState = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.first.id]),
      });

      const result = AllocationStateEngine.compute(graph, buildState);

      // Allocated nodes are not allocatable (already allocated)
      expect(result.allocatableNodeIds.has(nodes.first.id)).toBe(false);
      // But unallocated reachable nodes are allocatable
      expect(result.allocatableNodeIds.has(nodes.second.id)).toBe(true);
    });
  });
});
