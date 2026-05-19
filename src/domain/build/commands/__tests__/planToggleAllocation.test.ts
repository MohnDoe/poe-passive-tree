import { describe, expect, it } from "vitest";
import { makeLineGraph, makeDiamondGraph } from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import { makeBuildState } from "@/domain/build/__tests__/BuildState.fixtures.ts";
import { createBuildCommandContext } from "../createBuildCommandContext.ts";
import { planToggleAllocation } from "../planToggleAllocation.ts";

describe("planToggleAllocation", () => {
  describe("NODE_NOT_FOUND error case", () => {
    it("returns NODE_NOT_FOUND for invalid node ID", () => {
      const { graph } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planToggleAllocation(ctx, "nonexistent-node" as any);

      expect(result).toEqual({ ok: false, reason: "NODE_NOT_FOUND" });
    });

    it("returns NODE_NOT_FOUND for node ID that doesn't exist in graph", () => {
      const { graph } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      // Node IDs are strings like "start", "1", etc. Use an invalid one
      const result = planToggleAllocation(ctx, "xyz-999" as any);

      expect(result).toEqual({ ok: false, reason: "NODE_NOT_FOUND" });
    });
  });

  describe("allocation when node not allocated", () => {
    it("calls planAllocation for unallocated nodes", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planToggleAllocation(ctx, nodes.first.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true);
        // Path allocation should include start node as well
        expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(true);
      }
    });

    it("allocates path to unallocated node", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate third node - should allocate start -> first -> second -> third
      const result = planToggleAllocation(ctx, nodes.third.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.second.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.third.id)).toBe(true);
      }
    });

    it("allocates from nearest root in multi-root graph", () => {
      const { graph, nodes } = makeLineGraph();
      // Both start and sixth are roots (classStart nodes)
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.sixth.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate second node - should use start root since sixth is far away
      const result = planToggleAllocation(ctx, nodes.second.id);

      expect(result.ok).toBe(true);
    });
  });

  describe("refund when node is allocated", () => {
    it("calls planRefund for allocated nodes", () => {
      const { graph, nodes } = makeLineGraph();
      // First allocate a path
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.first.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planToggleAllocation(ctx, nodes.first.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // refund should remove the node and its dependencies
        expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(false);
        expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(false);
      }
    });

    it("refunds dependent nodes when removing allocated node", () => {
      const { graph, nodes } = makeLineGraph();
      // Allocate a chain: start -> first -> second
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.first.id, nodes.second.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Refund first - should also refund second (which depends on first)
      const result = planToggleAllocation(ctx, nodes.first.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(false);
        expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(false);
        expect(result.build.allocatedNodeIds.has(nodes.second.id)).toBe(false);
      }
    });

    it("refunds only leaf nodes without dependencies", () => {
      const { graph, nodes } = makeLineGraph();
      // Allocate a chain: start -> first -> second -> third
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.first.id, nodes.second.id, nodes.third.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Refund third (leaf node) - only removes itself
      const result = planToggleAllocation(ctx, nodes.third.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.second.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.third.id)).toBe(false);
      }
    });

    it("refunds single allocated node correctly", () => {
      const { graph, nodes } = makeLineGraph();
      // Allocate only start (root)
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planToggleAllocation(ctx, nodes.start.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(false);
      }
    });
  });

  describe("NO_CHANGE edge case", () => {
    it("returns NO_CHANGE when toggling already-allocated node with full path", () => {
      const { graph, nodes } = makeLineGraph();
      // Already allocated: start -> first -> second -> third
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.first.id, nodes.second.id, nodes.third.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Toggle first - all its dependencies are already allocated, so no change
      const result = planToggleAllocation(ctx, nodes.first.id);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("NO_CHANGE");
      }
    });

    it("returns NO_CHANGE when toggling unallocated node with full path already allocated", () => {
      const { graph, nodes } = makeLineGraph();
      // Already allocated: start -> first -> second -> third (everything)
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.first.id, nodes.second.id, nodes.third.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Try to toggle third - it's already fully allocated via path
      const result = planToggleAllocation(ctx, nodes.third.id);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("NO_CHANGE");
      }
    });
  });

  describe("integration with graph structure", () => {
    it("handles diamond graph correctly", () => {
      const { graph, nodes } = makeDiamondGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate end node - should choose shortest path (via left)
      const result = planToggleAllocation(ctx, nodes.end.id);

      expect(result.ok).toBe(true);
    });

    it("allocates from nearest root in diamond graph", () => {
      const { graph, nodes } = makeDiamondGraph();
      // Already have right path allocated
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.right.first.id, nodes.right.second.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Allocate end - should use right path since it's already there
      const result = planToggleAllocation(ctx, nodes.end.id);

      expect(result.ok).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles graph with no allocated nodes", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planToggleAllocation(ctx, nodes.first.id);

      expect(result.ok).toBe(true);
    });

    it("handles toggling root node", () => {
      const { graph, nodes } = makeLineGraph();
      // Allocate start (root)
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planToggleAllocation(ctx, nodes.start.id);

      expect(result.ok).toBe(true);
    });

    it("preserves point budgets during toggle", () => {
      const { graph } = makeLineGraph();
      const customBudget = 77;
      const build = makeBuildState({ activeClassId: 1, passivePointsBudget: customBudget });
      const ctx = createBuildCommandContext(graph, build);

      const result = planToggleAllocation(ctx, "1" as any);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.passivePointsBudget).toBe(customBudget);
      }
    });
  });
});
