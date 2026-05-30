import { describe, expect, it } from "vitest";
import {
  makeDiamondGraph,
  makeForkGraph,
  makeLineGraph,
  makeNode,
  buildGraph,
} from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
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

    it("marks the start node as non-allocatable and non-reachable (forbidden kind)", () => {
      const { graph, nodes } = makeLineGraph();
      const buildState = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = AllocationStateEngine.compute(graph, buildState);

      expect(result.nodeStateById.get(nodes.start.id)!.allocatable).toBe(false);
      expect(result.nodeStateById.get(nodes.start.id)!.reachable).toBe(false);
    });

    it("marks reachable nodes as non-allocatable when budget is exhausted", () => {
      const { graph, nodes } = makeLineGraph();
      const buildState = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set(),
        passivePointsBudget: 0,
      });

      const result = AllocationStateEngine.compute(graph, buildState);

      // Start node is reachable but forbidden (classStart)
      expect(result.nodeStateById.get(nodes.start.id)!.allocatable).toBe(false);
      // Reachable nodes with cost > 0 are NOT allocatable when budget is 0
      expect(result.nodeStateById.get(nodes.first.id)!.reachable).toBe(true);
      expect(result.nodeStateById.get(nodes.first.id)!.allocatable).toBe(false);
      expect(result.nodeStateById.get(nodes.third.id)!.reachable).toBe(true);
      expect(result.nodeStateById.get(nodes.third.id)!.allocatable).toBe(false);
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

    it("marks allocated nodes with cost 0", () => {
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

    it("marks unreachable nodes as not reachable with null path", () => {
      const rootA = makeNode({ id: "root-a", kind: "classStart", classStartIndex: 1 });
      const connected = makeNode({ id: "connected" });
      const island = makeNode({ id: "island" });

      const graph = buildGraph({
        nodes: [rootA, connected, island],
        edgePairs: [[rootA.id, connected.id]],
      });

      const buildState = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = AllocationStateEngine.compute(graph, buildState);

      expect(result.nodeStateById.get(island.id)!.reachable).toBe(false);
      expect(result.nodeStateById.get(island.id)!.allocatable).toBe(false);
      expect(result.nodeStateById.get(island.id)!.cheapestPath).toBeNull();
      expect(result.nodeStateById.get(island.id)!.cheapestPathCost).toBeNull();
    });

    it("records activeEdgeKeys for allocated nodes", () => {
      const { graph, nodes } = makeLineGraph();
      const buildState = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.first.id, nodes.second.id]),
      });

      const result = AllocationStateEngine.compute(graph, buildState);

      expect(result.activeEdgeKeys.size).toBeGreaterThan(0);
    });

    it("records rootNodeIds for the active class", () => {
      const { graph } = makeLineGraph();
      const buildState = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = AllocationStateEngine.compute(graph, buildState);

      expect(result.rootNodeIds.size).toBeGreaterThan(0);
    });

    it("forwards activeClassId from buildState", () => {
      const { graph } = makeLineGraph();
      const buildState = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = AllocationStateEngine.compute(graph, buildState);

      expect(result.activeClassId).toBe(1);
    });
  });

  describe("diamond graph", () => {
    it("chooses shorter path when both paths unallocated", () => {
      const { graph, nodes } = makeDiamondGraph();
      const buildState = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = AllocationStateEngine.compute(graph, buildState);
      const endNode = result.nodeStateById.get(nodes.end.id)!;

      // Shorter path:  left-1 → end (cost = 2)
      // Longer path: right-1 → right-2 → end (cost = 3)
      expect(endNode.cheapestPathCost).toBe(2);
      expect(endNode.cheapestPath).toEqual([nodes.start.id, nodes.left.first.id, nodes.end.id]);
    });

    it("prefers path through allocated nodes even if longer in hops", () => {
      const { graph, nodes } = makeDiamondGraph();

      const buildState = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.right.first.id, nodes.right.second.id]),
      });

      const result = AllocationStateEngine.compute(graph, buildState);
      const endNode = result.nodeStateById.get(nodes.end.id)!;

      // Path through allocated nodes: start → right-1 → right-2 → end
      // Cost = 1 (only 'end' is unallocated on this path)
      expect(endNode.cheapestPathCost).toBe(1);
    });

    it("computes dependencies: end does not depend on either parent in diamond", () => {
      const { graph, nodes } = makeDiamondGraph();
      const buildState = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = AllocationStateEngine.compute(graph, buildState);
      const endNode = result.nodeStateById.get(nodes.end.id)!;

      // In a diamond, removing either parent still leaves a path to end
      // So end depends on neither left-1 nor right-1
      expect(endNode.dependsOn.has(nodes.left.first.id)).toBe(false);
      expect(endNode.dependsOn.has(nodes.right.first.id)).toBe(false);
    });
  });

  describe("fork graph", () => {
    it("marks branching node as required by both branch leaves", () => {
      const { graph, nodes } = makeForkGraph();
      const buildState = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([
          nodes.first.id,
          nodes.left.first.id,
          nodes.left.second.id,
          nodes.right.first.id,
          nodes.right.second.id,
        ]),
      });

      const result = AllocationStateEngine.compute(graph, buildState);
      const first = result.nodeStateById.get(nodes.first.id)!;

      // Both left-2 and right-2 depend on '1' (the branching node)
      expect(first.requiredBy.has(nodes.left.second.id)).toBe(true);
      expect(first.requiredBy.has(nodes.right.second.id)).toBe(true);
    });

    it("marks leaf nodes as depending on the branching node", () => {
      const { graph, nodes } = makeForkGraph();
      const buildState = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([
          nodes.first.id,
          nodes.left.first.id,
          nodes.left.second.id,
          nodes.right.first.id,
          nodes.right.second.id,
        ]),
      });

      const result = AllocationStateEngine.compute(graph, buildState);
      const leftSecond = result.nodeStateById.get(nodes.left.second.id)!;

      // left-2 depends on '1' (removing '1' makes left-2 unreachable)
      expect(leftSecond.dependsOn.has(nodes.first.id)).toBe(true);
    });
  });

  describe("allocatableNodeIds", () => {
    it("contains only allocatable nodes", () => {
      const { graph, nodes } = makeLineGraph();
      const buildState = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = AllocationStateEngine.compute(graph, buildState);

      expect(result.allocatableNodeIds.has(nodes.start.id)).toBe(false);
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
