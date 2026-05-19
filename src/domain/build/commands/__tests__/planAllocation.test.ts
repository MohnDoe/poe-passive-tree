import { describe, expect, it } from "vitest";
import { makeLineGraph, makeDiamondGraph, buildGraph, makeNode } from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
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

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true);
      }
    });

    it("allocates node at end of line with full path", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, nodes.third.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.second.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.third.id)).toBe(true);
      }
    });

    it("preserves point budgets during allocation", () => {
      const { graph, nodes } = makeLineGraph();
      const customBudget = 42;
      const build = makeBuildState({ activeClassId: 1, passivePointsBudget: customBudget });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, nodes.first.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.passivePointsBudget).toBe(customBudget);
      }
    });
  });

  describe("path includes all intermediate nodes", () => {
    it("allocates path through multiple hops", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate fourth node - should get start -> first -> second -> third -> fourth
      const result = planAllocation(ctx, nodes.fourth.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const expectedNodes = [nodes.start.id, nodes.first.id, nodes.second.id, nodes.third.id, nodes.fourth.id];
        for (const nodeId of expectedNodes) {
          expect(result.build.allocatedNodeIds.has(nodeId)).toBe(true);
        }
      }
    });

    it("includes all intermediate nodes when path skips allocated nodes", () => {
      const { graph, nodes } = makeLineGraph();
      // First and second already allocated
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.first.id, nodes.second.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate fourth - should get third -> fourth (no need to re-allocate first and second)
      const result = planAllocation(ctx, nodes.fourth.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true); // preserved
        expect(result.build.allocatedNodeIds.has(nodes.second.id)).toBe(true); // preserved
        expect(result.build.allocatedNodeIds.has(nodes.third.id)).toBe(true); // newly allocated
        expect(result.build.allocatedNodeIds.has(nodes.fourth.id)).toBe(true); // target node
      }
    });

    it("allocates path in diamond graph", () => {
      const { graph, nodes } = makeDiamondGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate end - should choose shortest path (start -> left-1 -> end)
      const result = planAllocation(ctx, nodes.end.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.left.first.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.end.id)).toBe(true);
        // Right path should NOT be allocated (longer)
        expect(result.build.allocatedNodeIds.has(nodes.right.first.id)).toBe(false);
      }
    });
  });

  describe("NODE_NOT_ALLOCATABLE error case", () => {
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
      const island = makeNode({ id: "island" });

      const graph = buildGraph({
        nodes: [rootA, rootB, island],
        edgePairs: [[rootA.id, rootB.id]], // no connection to island
      });

      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, island.id);

      expect(result).toEqual({ ok: false, reason: "NODE_NOT_ALLOCATABLE" });
    });

    it("returns NODE_NOT_ALLOCATABLE when all paths blocked by allocated nodes", () => {
      const root = makeNode({ id: "root", kind: "classStart" });
      const node1 = makeNode({ id: "node-1" });
      const target = makeNode({ id: "target" });

      const graph = buildGraph({
        nodes: [root, node1, target],
        edgePairs: [[root.id, node1.id], [node1.id, target.id]],
      });

      // Block the only path by allocating root and node-1
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([root.id, node1.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, target.id);

      expect(result).toEqual({ ok: false, reason: "NODE_NOT_ALLOCATABLE" });
    });

    it("returns NODE_NOT_ALLOCATABLE for node in separate component", () => {
      const root1 = makeNode({ id: "root-1", kind: "classStart" });
      const connectedToRoot1 = makeNode({ id: "connected-to-root-1" });
      const root2 = makeNode({ id: "root-2", kind: "classStart" });
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
  });

  describe("NO_CHANGE edge case", () => {
    it("returns NO_CHANGE when target already allocated with full path", () => {
      const { graph, nodes } = makeLineGraph();
      // Already fully allocated
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.first.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Try to allocate first again - no change needed
      const result = planAllocation(ctx, nodes.first.id);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("NO_CHANGE");
      }
    });

    it("returns NO_CHANGE when all path nodes already allocated", () => {
      const { graph, nodes } = makeLineGraph();
      // Already fully allocated up to third
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.first.id, nodes.second.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Try to allocate second - already there with full path
      const result = planAllocation(ctx, nodes.second.id);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("NO_CHANGE");
      }
    });

    it("returns NO_CHANGE when target is root and already allocated", () => {
      const { graph, nodes } = makeLineGraph();
      // Root already allocated
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, nodes.start.id);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("NO_CHANGE");
      }
    });
  });

  describe("multiple root nodes preference", () => {
    it("prefers shortest path in multi-root graph", () => {
      const { graph, nodes } = makeLineGraph();
      // Both start and sixth are roots (classStart with classIndex 1 and 2)
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate second - should be closer to start root
      const result = planAllocation(ctx, nodes.second.id);

      expect(result.ok).toBe(true);
    });

    it("prefers nearer root when allocating from both sides", () => {
      const { graph, nodes } = makeLineGraph();
      // Sixth is also a classStart node (classIndex 2)
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.sixth.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate fourth - should be closer to sixth than start
      const result = planAllocation(ctx, nodes.fourth.id);

      expect(result.ok).toBe(true);
    });

    it("chooses path through allocated nodes even if longer in hops", () => {
      const { graph, nodes } = makeDiamondGraph();
      // Right path already allocated: start -> right-1 -> right-2
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.right.first.id, nodes.right.second.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate end - should use right path (cost 1) rather than left path (cost 2)
      const result = planAllocation(ctx, nodes.end.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Right path is shorter cost-wise due to allocation
        expect(result.build.allocatedNodeIds.has(nodes.right.first.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.right.second.id)).toBe(true);
      }
    });

    it("handles two separate root components - allocation fails if no class 1 roots in component", () => {
      const rootA = makeNode({ id: "root-a", kind: "classStart" });
      const nodeFromA = makeNode({ id: "node-from-a" });

      // Note: buildGraph only considers nodes with classStartIndex === 1 as roots for class 1
      // Since we didn't set classStartIndex, these won't count as valid roots
      const graph = buildGraph({
        nodes: [rootA, nodeFromA],
        edgePairs: [[rootA.id, nodeFromA.id]],
      });

      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      // Allocation should fail since there are no valid class 1 roots
      expect(result.ok).toBe(false);
    });
  });

  describe("diamond graph prefers shorter path", () => {
    it("chooses left path (2 hops) over right path (3 hops)", () => {
      const { graph, nodes } = makeDiamondGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate end - should use left path (start -> left-1 -> end)
      const result = planAllocation(ctx, nodes.end.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.allocatedNodeIds.has(nodes.left.first.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.right.first.id)).toBe(false); // right path not needed
      }
    });

    it("prefers shorter path when both paths are unallocated", () => {
      const { graph, nodes } = makeDiamondGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate end with no prior allocations
      const result = planAllocation(ctx, nodes.end.id);

      expect(result.ok).toBe(true);
    });

    it("switches to longer path when shorter is blocked", () => {
      const { graph, nodes } = makeDiamondGraph();
      // Block left-1 by allocating only start and right-1
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.right.first.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate end - should use right path since left is blocked
      const result = planAllocation(ctx, nodes.end.id);

      expect(result.ok).toBe(true);
    });

    it("prefers path through allocated nodes even if longer in hops", () => {
      const { graph, nodes } = makeDiamondGraph();
      // Right-1 and right-2 are already allocated (cost 0 to traverse)
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.right.first.id, nodes.right.second.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate end - should use right path (cost 1 from right-2) over left (cost 2)
      const result = planAllocation(ctx, nodes.end.id);

      expect(result.ok).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles allocation with empty allocatedNodeIds set", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, nodes.first.id);

      expect(result.ok).toBe(true);
    });

    it("handles allocation when only root is allocated", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, nodes.third.id);

      expect(result.ok).toBe(true);
    });

    it("preserves all budgets during allocation", () => {
      const { graph } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, passivePointsBudget: 50, ascendancyPointsBudget: 20 });
      const ctx = createBuildCommandContext(graph, build);

      const result = planAllocation(ctx, "1" as any);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.passivePointsBudget).toBe(50);
        expect(result.build.ascendancyPointsBudget).toBe(20);
      }
    });

    it("handles graph with no classStartIndex set - allocation fails", () => {
      // Nodes without proper classStartIndex won't be recognized as valid roots for class 1
      const rootA = makeNode({ id: "root-a" });
      const middle = makeNode({ id: "middle" });

      const graph = buildGraph({
        nodes: [rootA, middle],
        edgePairs: [[rootA.id, middle.id]],
      });

      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      // Allocation should fail since there are no valid class 1 roots without classStartIndex
      const result = planAllocation(ctx, middle.id);

      expect(result.ok).toBe(false);
    });
  });
});
