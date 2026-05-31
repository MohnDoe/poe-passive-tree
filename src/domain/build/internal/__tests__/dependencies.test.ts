import { describe, expect, it } from "vitest";
import { makeLineGraph, makeDiamondGraph, makeForkGraph } from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import { computeDependencies } from "../dependencies.ts";

describe("computeDependencies", () => {
  it("computes dependencies in a line graph", () => {
    const { graph, nodes } = makeLineGraph();
    const allocatedNodeIds = new Set([nodes.first.id, nodes.second.id, nodes.third.id]);

    const result = computeDependencies({
      graph,
      allocatedNodeIds,
      startNodeIds: new Set([nodes.start.id]),
    });

    // second depends on first
    expect(result.dependsOnByNodeId.get(nodes.second.id)?.has(nodes.first.id)).toBe(true);
    // third depends on second
    expect(result.dependsOnByNodeId.get(nodes.third.id)?.has(nodes.second.id)).toBe(true);
    // first has no dependencies (connected to start node)
    expect(result.dependsOnByNodeId.get(nodes.first.id)?.size).toBe(0);
  });

  it("handles diamond graph: no dependencies (cycle provides alternative paths)", () => {
    const { graph, nodes } = makeDiamondGraph();
    const allocatedNodeIds = new Set([
      nodes.left.first.id,
      nodes.right.first.id,
      nodes.right.second.id,
      nodes.end.id,
    ]);

    const result = computeDependencies({
      graph,
      allocatedNodeIds,
      startNodeIds: new Set([nodes.start.id]),
    });

    // Diamond forms a cycle: start → left-1 → end → right-2 → right-1 → start
    // Removing any single allocated node still leaves all others reachable
    for (const nodeId of allocatedNodeIds) {
      expect(result.dependsOnByNodeId.get(nodeId)?.size).toBe(0);
    }
  });

  it("handles fork graph: each branch depends on common ancestor", () => {
    const { graph, nodes } = makeForkGraph();
    const allocatedNodeIds = new Set([
      nodes.first.id,
      nodes.left.first.id,
      nodes.left.second.id,
      nodes.right.first.id,
      nodes.right.second.id,
    ]);

    const result = computeDependencies({
      graph,
      allocatedNodeIds,
      startNodeIds: new Set([nodes.start.id]),
    });

    // left branch depends on first
    expect(result.dependsOnByNodeId.get(nodes.left.first.id)?.has(nodes.first.id)).toBe(true);
    // right branch depends on first
    expect(result.dependsOnByNodeId.get(nodes.right.first.id)?.has(nodes.first.id)).toBe(true);
    // left.second depends on left.first
    expect(result.dependsOnByNodeId.get(nodes.left.second.id)?.has(nodes.left.first.id)).toBe(true);
    // right.second depends on right.first
    expect(result.dependsOnByNodeId.get(nodes.right.second.id)?.has(nodes.right.first.id)).toBe(true);
  });
});
