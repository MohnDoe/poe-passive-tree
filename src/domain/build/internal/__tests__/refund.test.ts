import { describe, expect, it } from "vitest";
import { makeLineGraph, makeForkGraph, makeDiamondGraph } from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
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
});

describe("computeRefundEdgeKeys", () => {
  it("returns edges between refunded nodes and allocated neighbors", () => {
    const { graph, nodes } = makeLineGraph();
    const allocatedNodeIds = new Set([nodes.first.id, nodes.second.id, nodes.third.id]);
    const refundedNodeIds = new Set([nodes.third.id]);

    const edgeKeys = computeRefundEdgeKeys(refundedNodeIds, allocatedNodeIds, graph);

    // third is connected to second (allocated, not refunded)
    expect(edgeKeys.size).toBeGreaterThan(0);
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

    // All three nodes are refunded, so internal edges between them should be included
    expect(edgeKeys.size).toBeGreaterThan(0);
  });
});
