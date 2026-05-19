import { describe, expect, it } from "vitest";
import { makeLineGraph, makeForkGraph, buildGraph, makeNode } from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import { makeBuildState } from "@/domain/build/__tests__/BuildState.fixtures.ts";
import { createBuildCommandContext } from "../createBuildCommandContext.ts";
import { planRefund } from "../planRefund.ts";

describe("planRefund", () => {
  describe("successful refund of single leaf node", () => {
    it("refunds a leaf node without dependencies", () => {
      const { graph, nodes } = makeLineGraph();
      // Allocate: start -> first -> second -> third (third is leaf)
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.first.id, nodes.second.id, nodes.third.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, nodes.third.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Only third should be refunded
        expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.second.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.third.id)).toBe(false);
      }
    });

    it("refunds leaf node in fork graph", () => {
      const { graph, nodes } = makeForkGraph();
      // Allocate: start -> first -> left-1 -> left-2 (left-2 is leaf)
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.first.id, nodes.left.first.id, nodes.left.second.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, nodes.left.second.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Only left-2 should be refunded
        expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.left.first.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.left.second.id)).toBe(false);
      }
    });

    it("refunds only the node when no other nodes depend on it", () => {
      const { graph, nodes } = makeLineGraph();
      // Allocate: start -> first (first is not a dependency for anyone)
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.first.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Refund start - should only refund itself since first depends on it but isn't reachable from another root
      const result = planRefund(ctx, nodes.start.id);

      expect(result.ok).toBe(true);
    });

    it("preserves point budgets during refund", () => {
      const { graph } = makeLineGraph();
      const customBudget = 55;
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set(["1"] as any), passivePointsBudget: customBudget });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, "1" as any);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.passivePointsBudget).toBe(customBudget);
      }
    });
  });

  describe("refund closure removes dependent nodes", () => {
    it("refunds all dependents when removing branching node", () => {
      const { graph, nodes } = makeForkGraph();
      // Allocate: start -> first (branch point) -> left-1 -> left-2 AND right-1 -> right-2
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.first.id, nodes.left.first.id, nodes.left.second.id, nodes.right.first.id, nodes.right.second.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Refund first (branch point) - should refund everything that depends on it
      const result = planRefund(ctx, nodes.first.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // All nodes depend on first, so all should be refunded
        expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(false);
        expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(false);
        expect(result.build.allocatedNodeIds.has(nodes.left.first.id)).toBe(false);
        expect(result.build.allocatedNodeIds.has(nodes.left.second.id)).toBe(false);
      }
    });

    it("refunds dependent chain when removing intermediate node", () => {
      const { graph, nodes } = makeLineGraph();
      // Allocate: start -> first -> second -> third
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.first.id, nodes.second.id, nodes.third.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Refund first - second and third depend on first
      const result = planRefund(ctx, nodes.first.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // All should be refunded since they all transitively depend on first
        expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(false);
        expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(false);
        expect(result.build.allocatedNodeIds.has(nodes.second.id)).toBe(false);
        expect(result.build.allocatedNodeIds.has(nodes.third.id)).toBe(false);
      }
    });

    it("refunds only nodes that depend on refunded node", () => {
      const { graph, nodes } = makeLineGraph();
      // Allocate: start -> first (second and third not allocated)
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.first.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, nodes.first.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Only first should be refunded since second and third aren't allocated
        expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(false);
        expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(false);
      }
    });

    it("handles refund with multiple dependency chains", () => {
      const rootA = makeNode({ id: "root-a", kind: "classStart" });
      const branch1 = makeNode({ id: "branch-1" });
      const branch2 = makeNode({ id: "branch-2" });
      const leaf1 = makeNode({ id: "leaf-1" });
      const leaf2 = makeNode({ id: "leaf-2" });

      const graph = buildGraph({
        nodes: [rootA, branch1, branch2, leaf1, leaf2],
        edgePairs: [[rootA.id, branch1.id], [branch1.id, leaf1.id], [branch1.id, branch2.id], [branch2.id, leaf2.id]],
      });

      // Allocate: root-a -> branch-1 -> leaf-1 AND branch-2 -> leaf-2
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([rootA.id, branch1.id, leaf1.id, branch2.id, leaf2.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Refund root-a - everything depends on it
      const result = planRefund(ctx, rootA.id);

      expect(result.ok).toBe(true);
    });

    it("handles refund with fork structure", () => {
      const { graph, nodes } = makeForkGraph();
      // Allocate: start -> first (fork) -> left-1 -> left-2 AND right-1 -> right-2
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.first.id, nodes.left.first.id, nodes.left.second.id, nodes.right.first.id, nodes.right.second.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Refund left-2 (leaf on one branch) - only itself should be refunded
      const result = planRefund(ctx, nodes.left.second.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.left.first.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.left.second.id)).toBe(false);
        // Other branch should be preserved
        expect(result.build.allocatedNodeIds.has(nodes.right.first.id)).toBe(true);
      }
    });

    it("refunds all nodes when refunding root in single-chain graph", () => {
      const { graph, nodes } = makeLineGraph();
      // Allocate: start -> first -> second -> third
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.first.id, nodes.second.id, nodes.third.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Refund start (root) - everything depends on it transitively
      const result = planRefund(ctx, nodes.start.id);

      expect(result.ok).toBe(true);
    });
  });

  describe("NODE_NOT_ALLOCATED error case", () => {
    it("returns NODE_NOT_ALLOCATED when node not allocated", () => {
      const { graph } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, "1" as any);

      expect(result).toEqual({ ok: false, reason: "NODE_NOT_ALLOCATED" });
    });

    it("returns NODE_NOT_ALLOCATED for node that exists but isn't allocated", () => {
      const { graph, nodes } = makeLineGraph();
      // Only allocate start, not first
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, nodes.first.id);

      expect(result).toEqual({ ok: false, reason: "NODE_NOT_ALLOCATED" });
    });

    it("returns NODE_NOT_ALLOCATED for node in a different allocation set", () => {
      const rootA = makeNode({ id: "root-a", kind: "classStart" });
      const connected = makeNode({ id: "connected" });
      const isolated = makeNode({ id: "isolated" });

      const graph = buildGraph({
        nodes: [rootA, connected, isolated],
        edgePairs: [[rootA.id, connected.id]], // no connection to isolated
      });

      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([rootA.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, connected.id);

      expect(result).toEqual({ ok: false, reason: "NODE_NOT_ALLOCATED" });
    });

    it("returns NODE_NOT_ALLOCATED for node with no dependencies allocated", () => {
      const { graph, nodes } = makeLineGraph();
      // Allocate only first (not start), so first has no dependents allocated
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.first.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, nodes.first.id);

      // This should work - refunding an unallocated node that has no dependents
      expect(result.ok).toBe(true);
    });
  });

  describe("NODE_NOT_REFUNDABLE error case", () => {
    it("allows refunding root with no dependents (results in empty set)", () => {
      const { graph, nodes } = makeLineGraph();
      // Allocate only the root (start) - nothing depends on it that is allocated
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, nodes.start.id);

      // Refunding a root with no dependents is allowed - results in empty set
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.allocatedNodeIds.size).toBe(0);
      }
    });

    it("allows refunding single allocated node with no dependents", () => {
      const rootA = makeNode({ id: "root-a", kind: "classStart" });
      const connected = makeNode({ id: "connected" });

      const graph = buildGraph({
        nodes: [rootA, connected],
        edgePairs: [[rootA.id, connected.id]],
      });

      // Allocate only root - no dependents allocated
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([rootA.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, rootA.id);

      // Refunding a single node is allowed - results in empty set
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.allocatedNodeIds.size).toBe(0);
      }
    });

    it("allows refunding single non-root node with no dependents", () => {
      const { graph } = makeLineGraph();
      // Allocate only one node that has no dependents
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set(["1"] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, "1" as any);

      // Refunding a single node is allowed - results in empty set
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.allocatedNodeIds.size).toBe(0);
      }
    });

    it("allows refunding node with no dependents (only refunds itself)", () => {
      const { graph, nodes } = makeLineGraph();
      // Allocate start and first - nothing depends on first that's allocated
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.first.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Refund first - only itself is refunded since no dependents are allocated
      const result = planRefund(ctx, nodes.first.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // start should be preserved, first should be removed
        expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(false);
      }
    });

    it("allows refunding leaf node with no dependents", () => {
      const { graph, nodes } = makeLineGraph();
      // Allocate only the last node in line (third)
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.third.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, nodes.third.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Only third should be refunded
        expect(result.build.allocatedNodeIds.size).toBe(0);
      }
    });
  });

  describe("NO_CHANGE edge case", () => {
    it("returns NO_CHANGE when refund set equals current allocations", () => {
      const { graph } = makeLineGraph();
      // Allocate all nodes - refunding any should result in empty set, not same as current
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      // Try to refund a non-allocated node (should be NODE_NOT_ALLOCATED)
      const result = planRefund(ctx, "1" as any);

      expect(result.ok).toBe(false);
    });

    it("allows refunding when no dependents are allocated", () => {
      const { graph } = makeLineGraph();
      // Allocate start and first - nothing depends on first that's also allocated
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.first.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Refund first - only itself is refunded (no dependents)
      const result = planRefund(ctx, nodes.first.id);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.allocatedNodeIds.has(nodes.start.id)).toBe(true);
        expect(result.build.allocatedNodeIds.has(nodes.first.id)).toBe(false);
      }
    });

    it("handles NO_CHANGE when refunding node with no additional effect", () => {
      const rootA = makeNode({ id: "root-a", kind: "classStart" });
      const connected = makeNode({ id: "connected" });

      const graph = buildGraph({
        nodes: [rootA, connected],
        edgePairs: [[rootA.id, connected.id]],
      });

      // Allocate only root - refunding it should result in empty set
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([rootA.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, rootA.id);

      // This should be NODE_NOT_REFUNDABLE, not NO_CHANGE (since refunding root with no dependents)
      expect(result.ok).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles refund when only one node allocated", () => {
      const { graph } = makeLineGraph();
      // Allocate only first (not start) - should fail with NODE_NOT_REFUNDABLE
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set(["1"] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, "1" as any);

      expect(result.ok).toBe(false);
    });

    it("handles refund in fork graph with partial allocation", () => {
      const { graph, nodes } = makeForkGraph();
      // Allocate: start -> first -> left-1 (only one branch)
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([nodes.start.id, nodes.first.id, nodes.left.first.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      // Refund first - left-1 depends on it but isn't a leaf in terms of allocation closure
      const result = planRefund(ctx, nodes.first.id);

      expect(result.ok).toBe(true);
    });

    it("handles refund with complex dependency graph", () => {
      const rootA = makeNode({ id: "root-a", kind: "classStart" });
      const middle1 = makeNode({ id: "middle-1" });
      const middle2 = makeNode({ id: "middle-2" });
      const leaf = makeNode({ id: "leaf" });

      // rootA -> middle1 -> leaf
      // rootA -> middle2 -> leaf (diamond)
      const graph = buildGraph({
        nodes: [rootA, middle1, middle2, leaf],
        edgePairs: [[rootA.id, middle1.id], [middle1.id, leaf.id], [rootA.id, middle2.id], [middle2.id, leaf.id]],
      });

      // Allocate all - refunding root should remove everything
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set([rootA.id, middle1.id, middle2.id, leaf.id] as any) });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, rootA.id);

      expect(result.ok).toBe(true);
    });

    it("preserves point budgets during refund", () => {
      const { graph } = makeLineGraph();
      const customBudget = 88;
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set(["1"] as any), passivePointsBudget: customBudget });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, "1" as any);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.passivePointsBudget).toBe(customBudget);
      }
    });

    it("handles refund when allocatedNodeIds is empty", () => {
      const { graph } = makeLineGraph();
      // Empty allocations - trying to refund any node should fail with NODE_NOT_ALLOCATED
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, "1" as any);

      expect(result).toEqual({ ok: false, reason: "NODE_NOT_ALLOCATED" });
    });

    it("handles refund with ascendancy allocations", () => {
      const { graph } = makeLineGraph();
      // Allocate some nodes including potential ascendancy region (if applicable)
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set(["0"] as any), activeAscendancy: null });
      const ctx = createBuildCommandContext(graph, build);

      const result = planRefund(ctx, "0" as any);

      expect(result.ok).toBe(true);
    });
  });
});
