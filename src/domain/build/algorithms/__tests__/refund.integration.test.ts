import { it, expect } from "vitest";
import { computeDependencies } from "../dependencies";
import { computeRefundClosure } from "../refund";
import { makeLineGraph } from "@/domain/graph/__tests__/PassiveGraph.fixtures";

it("refunds a leaf node after dependency computation", () => {
  const { graph, nodes } = makeLineGraph();

  const allocatedNodeIds = new Set([nodes.first.id, nodes.second.id]);
  const startNodeIds = new Set([nodes.start.id]);

  const refundTargetId = nodes.second.id;

  const { requiredByNodeId } = computeDependencies({
    graph,
    allocatedNodeIds,
    startNodeIds,
  });

  const refunded = computeRefundClosure(refundTargetId, allocatedNodeIds, requiredByNodeId);

  expect(refunded).toEqual(new Set([refundTargetId]));
  expect(refunded.has(nodes.first.id)).toBe(false);
  expect(refunded.has(nodes.start.id)).toBe(false);
});

it("refunds a middle node and cascades to its dependants after dependency computation", () => {
  const { graph, nodes } = makeLineGraph();

  const allocatedNodeIds = new Set([nodes.first.id, nodes.second.id, nodes.third.id]);
  const startNodeIds = new Set([nodes.start.id]);

  const { requiredByNodeId } = computeDependencies({
    graph,
    allocatedNodeIds,
    startNodeIds,
  });

  const refundTargetId = nodes.first.id;

  // Refunding first should cascade: first + second + third all go
  const refunded = computeRefundClosure(refundTargetId, allocatedNodeIds, requiredByNodeId);

  expect(refunded).toEqual(new Set([refundTargetId, nodes.second.id, nodes.third.id]));
  expect(refunded.has(nodes.start.id)).toBe(false);
});
