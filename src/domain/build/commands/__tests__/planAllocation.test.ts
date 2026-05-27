import { assert, describe, expect, it } from "vitest";
import {
  makeLineGraph,
  makeDiamondGraph,
  buildGraph,
  makeNode,
} from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import { makeBuildState } from "@/domain/build/__tests__/BuildState.fixtures.ts";
import { createBuildCommandContext } from "../createBuildCommandContext.ts";
import { planAllocation } from "../planAllocation.ts";

describe("planAllocation", () => {
  describe("successful allocation in line graph", () => {
    it("allocates single node with path to root", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, nodes.first.id);

      assert(result.ok);
      expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true);
    });

    it("allocates node at end of line with full path", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, nodes.third.id);

      assert(result.ok);
      expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.second.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.third.id)).toBe(true);
    });

    it("preserves point budgets during allocation", () => {
      const { graph, nodes } = makeLineGraph();
      const customBudget = 42;
      const build = makeBuildState({ activeClassId: 1, passivePointsBudget: customBudget });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, nodes.first.id);

      assert(result.ok);
      expect(result.build.passivePointsBudget).toBe(customBudget);
    });
  });

  describe("path includes all intermediate nodes", () => {
    it("includes all intermediate nodes when path skips allocated nodes", () => {
      const { graph, nodes } = makeLineGraph();
      // First and second already allocated
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.first.id, nodes.second.id]),
      });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate fourth - should get third -> fourth (no need to re-allocate first and second)
      const result = planAllocation(ctx, nodes.fourth.id);

      assert(result.ok);
      expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true); // preserved
      expect(result.build.allocatedNodeIds.has(nodes.second.id)).toBe(true); // preserved
      expect(result.build.allocatedNodeIds.has(nodes.third.id)).toBe(true); // newly allocated
      expect(result.build.allocatedNodeIds.has(nodes.fourth.id)).toBe(true); // target node
    });

    it("allocates shortest path in diamond graph", () => {
      const { graph, nodes } = makeDiamondGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate end - should choose shortest path (start -> left-1 -> end)
      const result = planAllocation(ctx, nodes.end.id);

      assert(result.ok);

      expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.left.first.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.end.id)).toBe(true);
      // Right path should NOT be allocated (longer)
      expect(result.build.allocatedNodeIds.has(nodes.right.first.id)).toBe(false);
    });
  });

  describe("error cases", () => {
    it("returns NODE_NOT_ALLOCATABLE for unreachable node in disconnected graph", () => {
      const root = makeNode({ id: "root", kind: "classStart" });
      const connected = makeNode({ id: "connected" });
      const island = makeNode({ id: "island" });

      const graph = buildGraph({
        nodes: [root, connected, island],
        edgePairs: [[root.id, connected.id]], // island is disconnected
      });

      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, island.id);

      expect(result).toEqual({ ok: false, reason: "NODE_NOT_ALLOCATABLE" });
    });

    it("returns NODE_NOT_ALLOCATABLE when no path exists to node", () => {
      const rootA = makeNode({ id: "root-a", kind: "classStart" });
      const rootB = makeNode({ id: "root-b", kind: "classStart" });
      const connected = makeNode({ id: "connected" });
      const island = makeNode({ id: "island" });

      const graph = buildGraph({
        nodes: [rootA, rootB, connected, island],
        edgePairs: [
          [rootA.id, connected.id],
          [rootB.id, connected.id],
        ], // no connection to island
      });

      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, island.id);

      expect(result).toEqual({ ok: false, reason: "NODE_NOT_ALLOCATABLE" });
    });

    it("returns NODE_NOT_ALLOCATABLE for node in separate component", () => {
      const root1 = makeNode({ id: "root-1", kind: "classStart", classStartIndex: 1 });
      const connectedToRoot1 = makeNode({ id: "connected-to-root-1" });
      const root2 = makeNode({ id: "root-2", kind: "classStart", classStartIndex: 1 });
      const isolatedNode = makeNode({ id: "isolated" });

      const graph = buildGraph({
        nodes: [root1, connectedToRoot1, root2, isolatedNode],
        edgePairs: [[root1.id, connectedToRoot1.id]], // no connection to isolated node
      });

      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, isolatedNode.id);

      expect(result).toEqual({ ok: false, reason: "NODE_NOT_ALLOCATABLE" });
    });

    it("returns NODE_NOT_ALLOCATABLE when target already allocated with full path", () => {
      const { graph, nodes } = makeLineGraph();
      // Already allocated
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.first.id, nodes.second.id]),
      });
      const ctx = createBuildCommandContext(graph, build);

      // Try to allocate first again
      const result = planAllocation(ctx, nodes.first.id);

      expect(result).toEqual({ ok: false, reason: "NODE_NOT_ALLOCATABLE" });
    });

    it("returns NODE_NOT_ALLOCATABLE when target is root", () => {
      const { graph, nodes } = makeLineGraph();

      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set(),
      });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, nodes.start.id);

      expect(result).toEqual({ ok: false, reason: "NODE_NOT_ALLOCATABLE" });
    });

    it("prefers shortest path in multi-root graph", () => {
      const { graph, nodes } = makeLineGraph();
      // has 2 roots for class 1
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate second - should be closer to start root
      const result = planAllocation(ctx, nodes.second.id);

      assert(result.ok);
      expect(result.build.allocatedNodeIds.has(nodes.second.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true);
      // path too long to strart from the other root
      expect(result.build.allocatedNodeIds.has(nodes.third.id)).toBe(false);
    });
  });

  describe("diamond graph prefers shorter path", () => {
    it("chooses path through allocated nodes even if longer in hops", () => {
      const { graph, nodes } = makeDiamondGraph();
      // Right path already allocated: start -> right-1 -> right-2
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.right.first.id, nodes.right.second.id]),
      });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate end - should use right path (cost 1) rather than left path (cost 2)
      const result = planAllocation(ctx, nodes.end.id);

      assert(result.ok);
      // Right path is shorter cost-wise due to allocation
      expect(result.build.allocatedNodeIds.has(nodes.end.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.right.first.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.right.second.id)).toBe(true);
      // too expensive
      expect(result.build.allocatedNodeIds.has(nodes.left.first.id)).toBe(false);
    });

    it("prefers shorter path when both paths are unallocated", () => {
      const { graph, nodes } = makeDiamondGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate end with no prior allocations
      const result = planAllocation(ctx, nodes.end.id);

      assert(result.ok);
      // left path is shorter cost-wise
      expect(result.build.allocatedNodeIds.has(nodes.end.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.left.first.id)).toBe(true);
      // too expensive
      expect(result.build.allocatedNodeIds.has(nodes.right.first.id)).toBe(false);
      expect(result.build.allocatedNodeIds.has(nodes.right.second.id)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles allocation with empty allocatedNodeIds set", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, nodes.first.id);

      assert(result.ok);
      expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true);
    });

    it("preserves all budgets during allocation", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({
        activeClassId: 1,
        passivePointsBudget: 50,
        ascendancyPointsBudget: 20,
      });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, nodes.first.id);

      assert(result.ok);
      expect(result.build.passivePointsBudget).toBe(50);
      expect(result.build.ascendancyPointsBudget).toBe(20);
    });

    it("fails when no class is active", () => {
      const { graph, nodes } = makeLineGraph();

      const build = makeBuildState({ activeClassId: null, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, nodes.first.id);

      expect(result).toEqual({ ok: false, reason: "NO_ACTIVE_CLASS" });
    });

    it("fails when no root nodes are in the graph", () => {
      const nodeA = makeNode({ id: "node-a" });
      const middle = makeNode({ id: "middle" });

      const graph = buildGraph({
        nodes: [nodeA, middle],
        edgePairs: [[nodeA.id, middle.id]],
      });

      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, middle.id);

      expect(result).toEqual({ ok: false, reason: "NODE_NOT_ALLOCATABLE" });
    });

    it("fails when no valid classStart root node are in the graph", () => {
      const rootA = makeNode({ id: "root-a", kind: "classStart", classStartIndex: 2 });
      const middle = makeNode({ id: "middle" });

      const graph = buildGraph({
        nodes: [rootA, middle],
        edgePairs: [[rootA.id, middle.id]],
      });

      // no roots for class 1
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, middle.id);

      expect(result).toEqual({ ok: false, reason: "NODE_NOT_ALLOCATABLE" });
    });
  });
});
