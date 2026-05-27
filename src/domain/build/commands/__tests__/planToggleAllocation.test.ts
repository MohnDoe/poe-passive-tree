import { assert, describe, expect, it } from "vitest";
import { makeLineGraph, makeDiamondGraph } from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import { makeBuildState } from "@/domain/build/__tests__/BuildState.fixtures.ts";
import { createBuildCommandContext } from "../createBuildCommandContext.ts";
import { planToggleAllocation } from "../planToggleAllocation.ts";

describe("planToggleAllocation", () => {
  describe("error cases", () => {
    it("returns NODE_NOT_FOUND for invalid node ID", () => {
      const { graph } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planToggleAllocation(ctx, "nonexistent-node");

      expect(result).toEqual({ ok: false, reason: "NODE_NOT_FOUND" });
    });
  });

  // ── Allocation (node not allocated) ─────────────────────────────────

  describe("allocation", () => {
    it("allocates path to unallocated node", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planToggleAllocation(ctx, nodes.third.id);

      assert(result.ok);

      expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.second.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.third.id)).toBe(true);
    });

    it("allocates from nearest root in multi-root graph", () => {
      const { graph, nodes } = makeLineGraph();
      // has 2 root nodes (start and otherStartNode)
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([]),
      });
      const ctx = createBuildCommandContext(graph, build);

      const result = planToggleAllocation(ctx, nodes.fifth.id);

      assert(result.ok);

      expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(false);
      expect(result.build.allocatedNodeIds.has(nodes.second.id)).toBe(false);
      expect(result.build.allocatedNodeIds.has(nodes.third.id)).toBe(false);
      expect(result.build.allocatedNodeIds.has(nodes.fourth.id)).toBe(false);

      // the cheapest path is otherStartNode -> fifth -> sixth
      expect(result.build.allocatedNodeIds.has(nodes.fifth.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.sixth.id)).toBe(true);
    });

    it("handles graph with allocated nodes", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.first.id]),
      });
      const ctx = createBuildCommandContext(graph, build);

      const result = planToggleAllocation(ctx, nodes.second.id);

      assert(result.ok);
      expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.second.id)).toBe(true);
    });
  });

  // ── Refund (node is allocated) ──────────────────────────────────────

  describe("refund", () => {
    it("refunds leaf node without dependents", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.first.id, nodes.second.id, nodes.third.id]),
      });
      const ctx = createBuildCommandContext(graph, build);

      const result = planToggleAllocation(ctx, nodes.third.id);

      assert(result.ok);
      expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.second.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.third.id)).toBe(false);
    });

    it("refunds dependent chain when removing intermediate node", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.first.id, nodes.second.id, nodes.third.id]),
      });
      const ctx = createBuildCommandContext(graph, build);

      // Refund first: second and third depend on first
      const result = planToggleAllocation(ctx, nodes.first.id);

      assert(result.ok);
      expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(false);
      expect(result.build.allocatedNodeIds.has(nodes.second.id)).toBe(false);
      expect(result.build.allocatedNodeIds.has(nodes.third.id)).toBe(false);
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles diamond graph by picking cheapest branch path", () => {
      const { graph, nodes } = makeDiamondGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planToggleAllocation(ctx, nodes.end.id);

      assert(result.ok);

      expect(result.build.allocatedNodeIds.has(nodes.left.first.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.end.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.right.first.id)).toBe(false);
      expect(result.build.allocatedNodeIds.has(nodes.right.second.id)).toBe(false);
    });

    it("allocates from nearest root in diamond graph", () => {
      const { graph, nodes } = makeDiamondGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.right.first.id, nodes.right.second.id]),
      });
      const ctx = createBuildCommandContext(graph, build);

      const result = planToggleAllocation(ctx, nodes.end.id);

      assert(result.ok);

      expect(result.build.allocatedNodeIds.has(nodes.left.first.id)).toBe(false);
      expect(result.build.allocatedNodeIds.has(nodes.right.first.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.right.second.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.end.id)).toBe(true);
    });
  });
});
