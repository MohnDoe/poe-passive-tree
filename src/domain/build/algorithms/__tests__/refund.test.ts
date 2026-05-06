import type { NodeId } from "@/domain/graph/PassiveNode";
import { computeRefundClosure, computeRefundEdgeKeys } from "../refund";
import { describe, expect, it } from "vitest";
import {
  makeLineGraph,
  makeNode,
  buildGraph,
  makeDiamondGraph,
} from "@/domain/graph/__tests__/PassiveGraph.fixtures";
import { makeEdgeKey } from "@/domain/graph/edgeKeys";

describe("computeRefundClosure", () => {
  it("refunds a leaf node (nothing else is required by it)", () => {
    const targetNodeId = "refund-me";
    const allocatedNodeIds = new Set(["0", "refund-me"]);
    const requiredByNodeId = new Map<NodeId, Set<NodeId>>([["0", new Set(["refund-me"])]]);

    const refundedNodeIds = computeRefundClosure(targetNodeId, allocatedNodeIds, requiredByNodeId);

    expect(refundedNodeIds.size).toBe(1);
    expect(refundedNodeIds.has(targetNodeId)).toBe(true);
  });

  it("does not refund anything if node is not allocated", () => {
    const targetNodeId = "refund-me";
    const allocatedNodeIds = new Set(["0"]);
    const requiredByNodeId = new Map<NodeId, Set<NodeId>>();

    const refundedNodeIds = computeRefundClosure(targetNodeId, allocatedNodeIds, requiredByNodeId);

    expect(refundedNodeIds.size).toBe(0);
  });

  it("refunds a node that cascades to a chain of dependants - simple line", () => {
    const targetNodeId = "refund-me";
    const allocatedNodeIds = new Set(["refund-me", "1", "2"]);
    // refund-me -- 1 -- 2
    const requiredByNodeId = new Map<NodeId, Set<NodeId>>([
      ["refund-me", new Set(["1"])],
      ["1", new Set(["2"])],
    ]);

    const refundedNodeIds = computeRefundClosure(targetNodeId, allocatedNodeIds, requiredByNodeId);

    expect(refundedNodeIds.size).toBe(3);
    expect(refundedNodeIds.has(targetNodeId)).toBe(true);
    expect(refundedNodeIds.has("1")).toBe(true);
    expect(refundedNodeIds.has("2")).toBe(true);
  });

  it("refunds a node that cascades to a chain of dependants - fanning out", () => {
    const targetNodeId = "refund-me";
    const allocatedNodeIds = new Set(["refund-me", "1", "2a", "2b", "3a", "3b"]);
    // refund-me -- 1 -- [2a -- 3a, 2b -- 3b]
    const requiredByNodeId = new Map<NodeId, Set<NodeId>>([
      ["refund-me", new Set(["1"])],
      ["1", new Set(["2a", "2b"])],
      ["2a", new Set(["3a"])],
      ["2b", new Set(["3b"])],
    ]);

    const refundedNodeIds = computeRefundClosure(targetNodeId, allocatedNodeIds, requiredByNodeId);

    expect(refundedNodeIds.size).toBe(6);
    expect(refundedNodeIds.has(targetNodeId)).toBe(true);
    expect(refundedNodeIds.has("1")).toBe(true);
    expect(refundedNodeIds.has("2a")).toBe(true);
    expect(refundedNodeIds.has("2b")).toBe(true);
    expect(refundedNodeIds.has("3a")).toBe(true);
    expect(refundedNodeIds.has("3b")).toBe(true);
  });
});

describe("computeRefundEdgeKeys", () => {
  it("returns no edges when refunded set is empty", () => {
    const { graph } = makeLineGraph();

    const edgeKeys = computeRefundEdgeKeys(new Set(), new Set(), graph);

    expect(edgeKeys.size).toBe(0);
  });

  it("returns no edges when refunded node has no neighbour", () => {
    // isolated node — not connected to anything allocated or refunded
    const isolated = makeNode({ id: "isolated" });
    const graph = buildGraph({ nodes: [isolated], edgePairs: [] });
    const edgeKeys = computeRefundEdgeKeys(new Set([isolated.id]), new Set(), graph);

    expect(edgeKeys.size).toBe(0);
  });

  it("returns no edges when refunded node has no allocated neighbour", () => {
    const { graph, nodes } = makeLineGraph();

    // refunding first and second — the edge between them is internal
    const refundedNodeIds = new Set([nodes.first.id]);
    const allocatedNodeIds = new Set([nodes.first.id]);

    const edgeKeys = computeRefundEdgeKeys(refundedNodeIds, allocatedNodeIds, graph);

    expect(edgeKeys.size).toBe(0);
  });

  it("includes the edge between two refunded adjacent nodes", () => {
    const { graph, nodes } = makeLineGraph();

    // refunding first and second — the edge between them is internal
    const refundedNodeIds = new Set([nodes.first.id, nodes.second.id]);
    const allocatedNodeIds = new Set([nodes.first.id, nodes.second.id]);

    const edgeKeys = computeRefundEdgeKeys(refundedNodeIds, allocatedNodeIds, graph);

    expect(edgeKeys.has(makeEdgeKey(nodes.first.id, nodes.second.id))).toBe(true);
  });

  it("includes all internal edges in a refunded chain", () => {
    const { graph, nodes } = makeLineGraph();

    // refunding first, second, third -> two internal edges
    const refundedNodeIds = new Set([nodes.first.id, nodes.second.id, nodes.third.id]);
    const allocatedNodeIds = new Set([nodes.first.id, nodes.second.id, nodes.third.id]);

    const edgeKeys = computeRefundEdgeKeys(refundedNodeIds, allocatedNodeIds, graph);

    expect(edgeKeys.has(makeEdgeKey(nodes.first.id, nodes.second.id))).toBe(true);
    expect(edgeKeys.has(makeEdgeKey(nodes.second.id, nodes.third.id))).toBe(true);
  });

  // ─── Anchor edges (one end refunded, one end allocated-but-kept) ─────────────

  it("includes the anchor edge connecting the refunded cluster to the remaining tree", () => {
    const { graph, nodes } = makeLineGraph();

    const allocatedNodeIds = new Set([nodes.first.id, nodes.second.id]);
    // refunding second only -> start and first are kept allocated
    // the edge first--second is the anchor edge (even if second is not allocated after refund)
    const refundedNodeIds = new Set([nodes.second.id]);

    const edgeKeys = computeRefundEdgeKeys(refundedNodeIds, allocatedNodeIds, graph);

    expect(edgeKeys.has(makeEdgeKey(nodes.first.id, nodes.second.id))).toBe(true);
  });

  it("includes both internal edges and the anchor edge when refunding a mid-chain cluster", () => {
    const { graph, nodes } = makeLineGraph();

    const allocatedNodeIds = new Set([
      nodes.first.id,
      nodes.second.id,
      nodes.third.id,
      nodes.fourth.id,
      nodes.fifth.id,
    ]);
    // start -- first(kept) -- second(refunded) -- third(refunded) -- fourth(refunded) -- fifth(kept)
    // anchor edges: first--second and fourth--fifth
    const refundedNodeIds = new Set([nodes.second.id, nodes.third.id, nodes.fourth.id]);

    const edgeKeys = computeRefundEdgeKeys(refundedNodeIds, allocatedNodeIds, graph);

    // internal edges within the refunded cluster
    expect(edgeKeys.has(makeEdgeKey(nodes.second.id, nodes.third.id))).toBe(true);
    expect(edgeKeys.has(makeEdgeKey(nodes.third.id, nodes.fourth.id))).toBe(true);

    // anchor edge back to the kept tree
    expect(edgeKeys.has(makeEdgeKey(nodes.first.id, nodes.second.id))).toBe(true);

    // anchor edge forward to the kept tree
    expect(edgeKeys.has(makeEdgeKey(nodes.fourth.id, nodes.fifth.id))).toBe(true);
  });

  it("does not include edges to neighbours that are neither refunded nor allocated", () => {
    const { graph, nodes } = makeLineGraph();

    const allocatedNodeIds = new Set([nodes.first.id, nodes.second.id]);
    // third and beyond are not in allocatedNodeIds — no edge to them should appear
    const refundedNodeIds = new Set([nodes.second.id]);

    const edgeKeys = computeRefundEdgeKeys(refundedNodeIds, allocatedNodeIds, graph);

    expect(edgeKeys.has(makeEdgeKey(nodes.second.id, nodes.third.id))).toBe(false);

    expect(edgeKeys.has(makeEdgeKey(nodes.first.id, nodes.second.id))).toBe(true);
  });

  // Diamond
  it("diamond: refunding one side includes its internal edges and anchor back to start", () => {
    const { graph, nodes } = makeDiamondGraph();
    const allocatedNodeIds = new Set([
      nodes.left.first.id,
      nodes.right.first.id,
      nodes.right.second.id,
      nodes.end.id,
    ]);

    // refunding right-1 and right-2, keeping start, left-1, end allocated
    const refundedNodeIds = new Set([nodes.right.first.id, nodes.right.second.id]);

    const edgeKeys = computeRefundEdgeKeys(refundedNodeIds, allocatedNodeIds, graph);

    // internal edge within the refunded cluster
    expect(edgeKeys.has(makeEdgeKey(nodes.right.first.id, nodes.right.second.id))).toBe(true);

    // anchor edge from right-2 to end (kept allocated)
    expect(edgeKeys.has(makeEdgeKey(nodes.right.second.id, nodes.end.id))).toBe(true);

    // left side edges are untouched
    expect(edgeKeys.has(makeEdgeKey(nodes.start.id, nodes.left.first.id))).toBe(false);
    expect(edgeKeys.has(makeEdgeKey(nodes.left.first.id, nodes.end.id))).toBe(false);
  });
});
