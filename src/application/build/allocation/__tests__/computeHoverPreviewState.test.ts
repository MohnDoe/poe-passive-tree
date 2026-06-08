import { assert, describe, expect, it } from "vitest";
import {
  makeForkGraph,
  makeLineGraph,
  makeNode,
  buildGraph,
} from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import { makeBuildState } from "@/domain/build/__tests__/BuildState.fixtures.ts";
import { AllocationStateEngine } from "@/domain/build/AllocationState";
import { computeHoverPreviewState } from "../computeHoverPreviewState";

describe("computeHoverPreviewState", () => {
  describe("allocated node — refund highlight", () => {
    it("shows refund nodeId for a leaf node", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.first.id, nodes.second.id, nodes.third.id]),
      });
      const allocationState = AllocationStateEngine.compute(graph, build);

      const result = computeHoverPreviewState({
        allocationState,
        hoveredNodeId: nodes.third.id,
        graph,
        build,
      });

      expect(result.hoveredNodeId).toBe(nodes.third.id);

      expect(result.refund).toBeDefined();
      expect(result.refund.nodeIds).toContain(nodes.third.id);
      expect(result.refund.edgeKeys.size).toBeGreaterThan(0);
    });

    it("shows full refund closure for a branching node", () => {
      const { graph, nodes } = makeForkGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([
          nodes.first.id,
          nodes.left.first.id,
          nodes.left.second.id,
          nodes.right.first.id,
          nodes.right.second.id,
        ]),
      });
      const allocationState = AllocationStateEngine.compute(graph, build);

      const result = computeHoverPreviewState({
        allocationState,
        hoveredNodeId: nodes.first.id,
        graph,
        build,
      });

      expect(result.hoveredNodeId).toBe(nodes.first.id);
      expect(result.refund).toBeDefined();
      expect(result.refund.nodeIds).toContain(nodes.first.id);
      expect(result.refund.nodeIds).toContain(nodes.left.first.id);
      expect(result.refund.nodeIds).toContain(nodes.left.second.id);
      expect(result.refund.nodeIds).toContain(nodes.right.first.id);
      expect(result.refund.nodeIds).toContain(nodes.right.second.id);
    });

    it("does not show refund highlight for unallocated node", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set(),
      });
      const allocationState = AllocationStateEngine.compute(graph, build);

      const result = computeHoverPreviewState({
        allocationState,
        hoveredNodeId: nodes.first.id,
        graph,
        build,
      });

      expect(result.hoveredNodeId).toBe(nodes.first.id);
      expect(result.refund.nodeIds.size).toBe(0);
      expect(result.refund.edgeKeys.size).toBe(0);
    });
  });

  describe("unallocated reachable node — path highlight", () => {
    it("highlights unallocated nodes on cheapest path", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set(),
      });
      const allocationState = AllocationStateEngine.compute(graph, build);

      const result = computeHoverPreviewState({
        allocationState,
        hoveredNodeId: nodes.third.id,
        graph,
        build,
      });

      expect(result.hoveredNodeId).toBe(nodes.third.id);
      expect(result.highlight).toBeDefined();
      expect(result.highlight.nodeIds).toContain(nodes.first.id);
      expect(result.highlight.nodeIds).toContain(nodes.second.id);
      expect(result.highlight.nodeIds).toContain(nodes.third.id);
    });

    it("excludes already-allocated nodes from highlight", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.first.id]),
      });
      const allocationState = AllocationStateEngine.compute(graph, build);

      const result = computeHoverPreviewState({
        allocationState,
        hoveredNodeId: nodes.third.id,
        graph,
        build,
      });

      expect(result.highlight.nodeIds).not.toContain(nodes.first.id);
      expect(result.highlight.nodeIds).toContain(nodes.second.id);
      expect(result.highlight.nodeIds).toContain(nodes.third.id);
    });
  });

  describe("edge cases", () => {
    it("returns empty state when allocationState is null", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = computeHoverPreviewState({
        allocationState: null,
        hoveredNodeId: nodes.first.id,
        graph,
        build,
      });

      expect(result.hoveredNodeId).toBe(nodes.first.id);

      expect(result.highlight.nodeIds.size).toBe(0);
      expect(result.refund.nodeIds.size).toBe(0);
    });

    it("returns empty state when graph is null", () => {
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const allocationState = AllocationStateEngine.compute(
        buildGraph({ nodes: [], edgePairs: [] }),
        build,
      );

      const result = computeHoverPreviewState({
        allocationState,
        hoveredNodeId: "some-node",
        graph: null,
        build,
      });

      expect(result.hoveredNodeId).toBe("some-node");
      expect(result.highlight.nodeIds.size).toBe(0);
      expect(result.refund.nodeIds.size).toBe(0);
    });

    it("returns empty state for unreachable node", () => {
      const startA = makeNode({ id: "start-a", kind: "classStart", classStartIndex: 1 });
      const island = makeNode({ id: "island" });
      const graph = buildGraph({
        nodes: [startA, island],
        edgePairs: [],
      });
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const allocationState = AllocationStateEngine.compute(graph, build);

      const result = computeHoverPreviewState({
        allocationState,
        hoveredNodeId: "island",
        graph,
        build,
      });

      expect(result.hoveredNodeId).toBe("island");
      expect(result.highlight.nodeIds.size).toBe(0);
      expect(result.refund.nodeIds.size).toBe(0);
    });

    it("returns empty state when hoveredNodeId is null", () => {
      const { graph } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const allocationState = AllocationStateEngine.compute(graph, build);

      const result = computeHoverPreviewState({
        allocationState,
        hoveredNodeId: null,
        graph,
        build,
      });

      expect(result.hoveredNodeId).toBeNull();
      expect(result.highlight.nodeIds.size).toBe(0);
      expect(result.refund.nodeIds.size).toBe(0);
    });
  });

  describe("tooltip data", () => {
    it("shows node name, kind, and stats for a hovered node", () => {
      const { graph, nodes } = makeLineGraph();
      const node = nodes.second;
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const allocationState = AllocationStateEngine.compute(graph, build);

      const result = computeHoverPreviewState({
        allocationState,
        hoveredNodeId: node.id,
        graph,
        build,
      });

      assert(result.tooltip);
      expect(result.tooltip.name).toBe(node.name);
      expect(result.tooltip.kind).toBe(node.kind);
      expect(result.tooltip.stats).toEqual(node.stats);
    });

    it("shows up when allocationState is null", () => {
      const { graph, nodes } = makeLineGraph();
      const node = nodes.first;
      const build = makeBuildState({ activeClassId: null, allocatedNodeIds: new Set() });

      const result = computeHoverPreviewState({
        allocationState: null,
        hoveredNodeId: node.id,
        graph,
        build,
      });

      assert(result.tooltip);
      expect(result.tooltip.name).toBe(node.name);
      expect(result.tooltip.kind).toBe(node.kind);
      expect(result.tooltip.stats).toEqual(node.stats);
    });

    it("shows allocation cost for an unallocated reachable node", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.first.id]),
      });
      const allocationState = AllocationStateEngine.compute(graph, build);

      const result = computeHoverPreviewState({
        allocationState,
        hoveredNodeId: nodes.third.id,
        graph,
        build,
      });

      assert(result.tooltip);
      // Path: start -> 1(allocated) -> 2(unallocated) -> 3(hovered)
      // 2 unallocated nodes on cheapest path
      expect(result.tooltip.budget.cost).toBe(2);
    });

    it("shows refund count for an allocated node", () => {
      const { graph, nodes } = makeForkGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([
          nodes.first.id,
          nodes.left.first.id,
          nodes.left.second.id,
          nodes.right.first.id,
          nodes.right.second.id,
        ]),
      });
      const allocationState = AllocationStateEngine.compute(graph, build);

      const result = computeHoverPreviewState({
        allocationState,
        hoveredNodeId: nodes.first.id,
        graph,
        build,
      });

      assert(result.tooltip);
      // Refund closure: first + left-1 + left-2 + right-1 + right-2 = 5 nodes
      expect(result.tooltip.budget.refundCount).toBe(5);
    });

    it("shows no budget cost for an unreachable node", () => {
      const startA = makeNode({ id: "start-a", kind: "classStart", classStartIndex: 1 });
      const island = makeNode({ id: "island", name: "node-island" });
      const graph = buildGraph({
        nodes: [startA, island],
        edgePairs: [],
      });
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const allocationState = AllocationStateEngine.compute(graph, build);

      const result = computeHoverPreviewState({
        allocationState,
        hoveredNodeId: "island",
        graph,
        build,
      });

      assert(result.tooltip);
      expect(result.tooltip.name).toBe("node-island");
      expect(result.tooltip.budget.cost).toBeNull();
      expect(result.tooltip.budget.refundCount).toBeNull();
    });

    it("is null when hoveredNodeId is null", () => {
      const { graph } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const allocationState = AllocationStateEngine.compute(graph, build);

      const result = computeHoverPreviewState({
        allocationState,
        hoveredNodeId: null,
        graph,
        build,
      });

      expect(result.tooltip).toBeNull();
    });

    it("is null when graph is null", () => {
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const allocationState = AllocationStateEngine.compute(
        buildGraph({ nodes: [], edgePairs: [] }),
        build,
      );

      const result = computeHoverPreviewState({
        allocationState,
        hoveredNodeId: "some-node",
        graph: null,
        build,
      });

      expect(result.tooltip).toBeNull();
    });
  });
});
