import { describe, expect, it } from "vitest";
import { makeLineGraph, makeForkGraph } from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import { makeBuildState } from "@/domain/build/__tests__/BuildState.fixtures.ts";
import { Build } from "../../Build";

describe("Build.computeRefundAnalysis", () => {
  it("returns canRefund false for non-existent node", () => {
    const { graph } = makeLineGraph();
    const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

    const analysis = Build.computeRefundAnalysis(graph, build, "nonexistent");

    expect(analysis.canRefund).toBe(false);
    expect(analysis.refundedNodeIds.size).toBe(0);
    expect(analysis.refundedEdgeKeys.size).toBe(0);
  });

  it("returns canRefund false for unallocated node", () => {
    const { graph, nodes } = makeLineGraph();
    const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

    const analysis = Build.computeRefundAnalysis(graph, build, nodes.first.id);

    expect(analysis.canRefund).toBe(false);
    expect(analysis.refundedNodeIds.size).toBe(0);
  });

  it("returns correct refund closure for leaf node", () => {
    const { graph, nodes } = makeLineGraph();
    const build = makeBuildState({
      activeClassId: 1,
      allocatedNodeIds: new Set([nodes.first.id, nodes.second.id, nodes.third.id]),
    });

    const analysis = Build.computeRefundAnalysis(graph, build, nodes.third.id);

    expect(analysis.canRefund).toBe(true);
    expect(analysis.refundedNodeIds).toEqual(new Set([nodes.third.id]));
    expect(analysis.refundedEdgeKeys.size).toBeGreaterThan(0);
  });

  it("returns correct refund closure for branching node", () => {
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

    const analysis = Build.computeRefundAnalysis(graph, build, nodes.first.id);

    expect(analysis.canRefund).toBe(true);
    expect(analysis.refundedNodeIds).toEqual(new Set([
      nodes.first.id,
      nodes.left.first.id,
      nodes.left.second.id,
      nodes.right.first.id,
      nodes.right.second.id,
    ]));
  });

  it("does not modify build state", () => {
    const { graph, nodes } = makeLineGraph();
    const build = makeBuildState({
      activeClassId: 1,
      allocatedNodeIds: new Set([nodes.first.id]),
    });
    const originalSize = build.allocatedNodeIds.size;

    Build.computeRefundAnalysis(graph, build, nodes.first.id);

    expect(build.allocatedNodeIds.size).toBe(originalSize);
  });
});
