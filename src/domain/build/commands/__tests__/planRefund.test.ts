import { makeBuildState } from "@/domain/build/__tests__/BuildState.fixtures.ts";
import {
  makeDiamondGraph,
  makeForkGraph,
  makeLineGraph,
} from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import { assert, describe, expect, it } from "vitest";
import { createBuildCommandContext } from "../createBuildCommandContext.ts";
import { planRefund } from "../planRefund.ts";

describe("planRefund", () => {
  describe("successful refund", () => {
    it("refunds a leaf node without dependents", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.first.id, nodes.second.id, nodes.third.id]),
      });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, nodes.third.id);

      assert(result.ok);

      expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.second.id)).toBe(true);

      expect(result.build.allocatedNodeIds.has(nodes.third.id)).toBe(false);
    });

    it("refunds leaf on one branch, preserves the other", () => {
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
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, nodes.left.second.id);

      assert(result.ok);

      expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.left.first.id)).toBe(true);

      expect(result.build.allocatedNodeIds.has(nodes.left.second.id)).toBe(false);

      expect(result.build.allocatedNodeIds.has(nodes.right.first.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.right.second.id)).toBe(true);
    });

    it("refunds only the node when it has no dependents", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.first.id]),
      });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, nodes.first.id);

      assert(result.ok);

      expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(false);
    });

    it("refunds all dependents when removing branching node", () => {
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
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, nodes.first.id);

      assert(result.ok);

      expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(false);
      expect(result.build.allocatedNodeIds.has(nodes.left.first.id)).toBe(false);
      expect(result.build.allocatedNodeIds.has(nodes.left.second.id)).toBe(false);
      expect(result.build.allocatedNodeIds.has(nodes.right.first.id)).toBe(false);
      expect(result.build.allocatedNodeIds.has(nodes.right.second.id)).toBe(false);
    });

    it("handles diamond graph: refunds node with no dependants", () => {
      const { graph, nodes } = makeDiamondGraph();
      // Allocate: start -> left-1 -> end AND start -> right-1 -> right-2 -> end
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([
          nodes.left.first.id,
          nodes.right.first.id,
          nodes.right.second.id,
          nodes.end.id,
        ]),
      });
      const ctx = createBuildCommandContext(graph, build);

      // Refund left-1: end is still reachable via right path, so left-1 has no dependants
      const result = planRefund(ctx, nodes.left.first.id);

      assert(result.ok);

      expect(result.build.allocatedNodeIds.has(nodes.left.first.id)).toBe(false);

      expect(result.build.allocatedNodeIds.has(nodes.right.first.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.right.second.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.end.id)).toBe(true);
    });

    it("refunds right-2 only (end has alternative path via left-1)", () => {
      const { graph, nodes } = makeDiamondGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([
          nodes.left.first.id,
          nodes.right.first.id,
          nodes.right.second.id,
          nodes.end.id,
        ]),
      });
      const ctx = createBuildCommandContext(graph, build);

      // Refund right-2: end is still reachable via start->left-1, so no dependants
      const result = planRefund(ctx, nodes.right.second.id);

      assert(result.ok);

      expect(result.build.allocatedNodeIds.has(nodes.right.second.id)).toBe(false);

      expect(result.build.allocatedNodeIds.has(nodes.left.first.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.right.first.id)).toBe(true);
      expect(result.build.allocatedNodeIds.has(nodes.end.id)).toBe(true);
    });

    it("handles refund when only one node allocated", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.first.id]),
      });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, nodes.first.id);

      assert(result.ok);
      expect(result.build.allocatedNodeIds.size).toBe(0);
    });
  });

  // ── Error cases ─────────────────────────────────────────────────────

  describe("NODE_NOT_FOUND error", () => {
    it("returns error when node does not exists", () => {
      const { graph } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, "unknown-node-id");

      expect(result).toEqual({ ok: false, reason: "NODE_NOT_FOUND" });
    });
  });

  describe("NODE_NOT_ALLOCATED error", () => {
    it("returns error for node that exists but isn't allocated", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([]),
      });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, nodes.first.id);

      expect(result).toEqual({ ok: false, reason: "NODE_NOT_ALLOCATED" });
    });
  });

});
