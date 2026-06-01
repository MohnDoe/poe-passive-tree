import { describe, expect, it } from "vitest";
import { makeEdgeKey } from "@/domain/graph/edgeKeys.ts";
import { makeLineGraph, makeForkGraph, makeDiamondGraph, makeNode, buildGraph } from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import type { NodeId } from "@/domain/graph/PassiveNode.ts";
import { computeRefundClosure, computeRefundEdgeKeys } from "../refund.ts";
import { computeDependencies } from "../dependencies.ts";

describe("computeRefundClosure", () => {
  it("refunds only the leaf node with no dependants", () => {
    const { graph, nodes } = makeLineGraph();
    const allocatedNodeIds = new Set([nodes.first.id, nodes.second.id, nodes.third.id]);

    const { requiredByNodeId } = computeDependencies({
      graph,
      allocatedNodeIds,
      startNodeIds: new Set([nodes.start.id]),
    });

    const closure = computeRefundClosure(nodes.third.id, allocatedNodeIds, requiredByNodeId);
    expect(closure).toEqual(new Set([nodes.third.id]));
  });

  it("refunds entire branch when removing branching node", () => {
    const { graph, nodes } = makeForkGraph();
    const allocatedNodeIds = new Set([
      nodes.first.id,
      nodes.left.first.id,
      nodes.left.second.id,
      nodes.right.first.id,
      nodes.right.second.id,
    ]);

    const { requiredByNodeId } = computeDependencies({
      graph,
      allocatedNodeIds,
      startNodeIds: new Set([nodes.start.id]),
    });

    const closure = computeRefundClosure(nodes.first.id, allocatedNodeIds, requiredByNodeId);
    expect(closure).toEqual(new Set([
      nodes.first.id,
      nodes.left.first.id,
      nodes.left.second.id,
      nodes.right.first.id,
      nodes.right.second.id,
    ]));
  });

  it("refunds node in diamond without affecting alternative path", () => {
    const { graph, nodes } = makeDiamondGraph();
    const allocatedNodeIds = new Set([
      nodes.left.first.id,
      nodes.right.first.id,
      nodes.right.second.id,
      nodes.end.id,
    ]);

    const { requiredByNodeId } = computeDependencies({
      graph,
      allocatedNodeIds,
      startNodeIds: new Set([nodes.start.id]),
    });

    // In the diamond, no node has dependants, so refunding any single node
    // only refunds that node
    const closure = computeRefundClosure(nodes.left.first.id, allocatedNodeIds, requiredByNodeId);
    expect(closure).toEqual(new Set([nodes.left.first.id]));
  });

  it("does not refund anything if node is not allocated", () => {
    const targetNodeId = "refund-me";
    const allocatedNodeIds = new Set(["0"]);
    const requiredByNodeId = new Map<NodeId, Set<NodeId>>();

    const refundedNodeIds = computeRefundClosure(targetNodeId, allocatedNodeIds, requiredByNodeId);

    expect(refundedNodeIds.size).toBe(0);
  });
});

describe("computeRefundEdgeKeys", () => {
  it("returns edges between refunded nodes and allocated neighbors", () => {
    const { graph, nodes } = makeLineGraph();
    const allocatedNodeIds = new Set([nodes.first.id, nodes.second.id, nodes.third.id]);
    const refundedNodeIds = new Set([nodes.third.id]);

    const edgeKeys = computeRefundEdgeKeys(refundedNodeIds, allocatedNodeIds, graph);

    // third is connected to second (allocated, not refunded)
    expect(edgeKeys).toEqual(new Set([makeEdgeKey("3", "2")]));
  });

  it("includes internal edges within refund cluster", () => {
    const { graph, nodes } = makeForkGraph();
    const allocatedNodeIds = new Set([
      nodes.first.id,
      nodes.left.first.id,
      nodes.left.second.id,
    ]);
    const refundedNodeIds = new Set([
      nodes.first.id,
      nodes.left.first.id,
      nodes.left.second.id,
    ]);

    const edgeKeys = computeRefundEdgeKeys(refundedNodeIds, allocatedNodeIds, graph);

    // Internal edges between refunded nodes in both directions
    expect(edgeKeys).toEqual(
      new Set([
        makeEdgeKey("1", "left-1"),
        makeEdgeKey("left-1", "1"),
        makeEdgeKey("left-1", "left-2"),
        makeEdgeKey("left-2", "left-1"),
      ]),
    );
  });

  it("returns no edges when refunded set is empty", () => {
    const { graph } = makeLineGraph();

    const edgeKeys = computeRefundEdgeKeys(new Set(), new Set(), graph);

    expect(edgeKeys.size).toBe(0);
  });

  it("returns no edges when refunded node has no neighbour", () => {
    const isolated = makeNode({ id: "isolated" });
    const graph = buildGraph({ nodes: [isolated], edgePairs: [] });
    const edgeKeys = computeRefundEdgeKeys(new Set([isolated.id]), new Set(), graph);

    expect(edgeKeys.size).toBe(0);
  });

  it("returns no edges when refunded node has no allocated neighbour", () => {
    const { graph, nodes } = makeLineGraph();

    const refundedNodeIds = new Set([nodes.first.id]);
    const allocatedNodeIds = new Set([nodes.first.id]);

    const edgeKeys = computeRefundEdgeKeys(refundedNodeIds, allocatedNodeIds, graph);

    expect(edgeKeys.size).toBe(0);
  });

  it("includes the edge between two refunded adjacent nodes", () => {
    const { graph, nodes } = makeLineGraph();

    const refundedNodeIds = new Set([nodes.first.id, nodes.second.id]);
    const allocatedNodeIds = new Set([nodes.first.id, nodes.second.id]);

    const edgeKeys = computeRefundEdgeKeys(refundedNodeIds, allocatedNodeIds, graph);

    expect(edgeKeys.has(makeEdgeKey(nodes.first.id, nodes.second.id))).toBe(true);
  });

  it("includes all internal edges in a refunded chain", () => {
    const { graph, nodes } = makeLineGraph();

    const refundedNodeIds = new Set([nodes.first.id, nodes.second.id, nodes.third.id]);
    const allocatedNodeIds = new Set([nodes.first.id, nodes.second.id, nodes.third.id]);

    const edgeKeys = computeRefundEdgeKeys(refundedNodeIds, allocatedNodeIds, graph);

    expect(edgeKeys.has(makeEdgeKey(nodes.first.id, nodes.second.id))).toBe(true);
    expect(edgeKeys.has(makeEdgeKey(nodes.second.id, nodes.third.id))).toBe(true);
  });

  it("includes the anchor edge connecting the refunded cluster to the remaining tree", () => {
    const { graph, nodes } = makeLineGraph();

    const allocatedNodeIds = new Set([nodes.first.id, nodes.second.id]);
    const refundedNodeIds = new Set([nodes.second.id]);

    const edgeKeys = computeRefundEdgeKeys(refundedNodeIds, allocatedNodeIds, graph);

    expect(edgeKeys.has(makeEdgeKey(nodes.first.id, nodes.second.id))).toBe(true);
  });

  it("does not include edges to neighbours that are neither refunded nor allocated", () => {
    const { graph, nodes } = makeLineGraph();

    const allocatedNodeIds = new Set([nodes.first.id, nodes.second.id]);
    const refundedNodeIds = new Set([nodes.second.id]);

    const edgeKeys = computeRefundEdgeKeys(refundedNodeIds, allocatedNodeIds, graph);

    expect(edgeKeys.has(makeEdgeKey(nodes.second.id, nodes.third.id))).toBe(false);
    expect(edgeKeys.has(makeEdgeKey(nodes.first.id, nodes.second.id))).toBe(true);
  });

  it("diamond: refunding one side includes its internal edges and anchor back to start", () => {
    const { graph, nodes } = makeDiamondGraph();
    const allocatedNodeIds = new Set([
      nodes.left.first.id,
      nodes.right.first.id,
      nodes.right.second.id,
      nodes.end.id,
    ]);

    const refundedNodeIds = new Set([nodes.right.first.id, nodes.right.second.id]);

    const edgeKeys = computeRefundEdgeKeys(refundedNodeIds, allocatedNodeIds, graph);

    expect(edgeKeys.has(makeEdgeKey(nodes.right.first.id, nodes.right.second.id))).toBe(true);
    expect(edgeKeys.has(makeEdgeKey(nodes.right.second.id, nodes.end.id))).toBe(true);
    expect(edgeKeys.has(makeEdgeKey(nodes.start.id, nodes.left.first.id))).toBe(false);
    expect(edgeKeys.has(makeEdgeKey(nodes.left.first.id, nodes.end.id))).toBe(false);
  });
});
