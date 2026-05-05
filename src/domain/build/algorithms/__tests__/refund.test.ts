import type { NodeId } from "@/domain/graph/PassiveNode";
import { computeRefundClosure } from "../refund";
import { describe, expect, it } from "vitest";

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

  it("refunds a node that cascades to a chain of dependants - fork", () => {
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
