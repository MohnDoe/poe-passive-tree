import { describe, expect, it } from "vitest";
import {
  makeLineGraph,
  makeDiamondGraph,
  makeForkGraph,
  makeNode,
  buildGraph,
} from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import {
  computeWeightedPaths,
  materializePath,
} from "../pathfinding.ts";

describe("computeWeightedPaths", () => {
  it("finds shortest path in a line graph", () => {
    const { graph, nodes } = makeLineGraph();

    const result = computeWeightedPaths({
      graph,
      startNodeIds: new Set([nodes.start.id]),
      allocatedNodeIds: new Set(),
    });

    expect(result.distanceByNodeId.get(nodes.first.id)).toBe(1);
    expect(result.distanceByNodeId.get(nodes.second.id)).toBe(2);
    expect(result.distanceByNodeId.get(nodes.third.id)).toBe(3);
  });

  it("treats allocated nodes as free to traverse", () => {
    const { graph, nodes } = makeLineGraph();

    const result = computeWeightedPaths({
      graph,
      startNodeIds: new Set([nodes.start.id]),
      allocatedNodeIds: new Set([nodes.first.id, nodes.second.id]),
    });

    // first and second are free (cost 0), third costs 1
    expect(result.distanceByNodeId.get(nodes.first.id)).toBe(0);
    expect(result.distanceByNodeId.get(nodes.second.id)).toBe(0);
    expect(result.distanceByNodeId.get(nodes.third.id)).toBe(1);
  });

  it("prefers shorter path in a diamond when both paths are unallocated", () => {
    const { graph, nodes } = makeDiamondGraph();

    const result = computeWeightedPaths({
      graph,
      startNodeIds: new Set([nodes.start.id]),
      allocatedNodeIds: new Set(),
    });

    // left path: start -> left.first -> end = cost 2
    // right path: start -> right.first -> right.second -> end = cost 3
    expect(result.distanceByNodeId.get(nodes.left.first.id)).toBe(1);
    expect(result.distanceByNodeId.get(nodes.end.id)).toBe(2);
  });

  it("prefers path through allocated nodes even if longer in hops", () => {
    const { graph, nodes } = makeDiamondGraph();

    const result = computeWeightedPaths({
      graph,
      startNodeIds: new Set([nodes.start.id]),
      allocatedNodeIds: new Set([nodes.right.first.id, nodes.right.second.id]),
    });

    // right path is free (allocated), left path costs 1
    expect(result.distanceByNodeId.get(nodes.right.first.id)).toBe(0);
    expect(result.distanceByNodeId.get(nodes.right.second.id)).toBe(0);
    expect(result.distanceByNodeId.get(nodes.end.id)).toBe(1); // only left.first costs 1
  });

  it("returns empty path for unreachable node", () => {
    const rootA = makeNode({ id: "root-a", kind: "classStart" });
    const island = makeNode({ id: "island" });

    const graph = buildGraph({
      nodes: [rootA, island],
      edgePairs: [],
    });

    const path = materializePath(island.id, new Map());
    expect(path).toEqual([]);
  });
});

describe("materializePath", () => {
  it("reconstructs path from predecessor map", () => {
    const { graph, nodes } = makeLineGraph();

    const { predecessorByNodeId } = computeWeightedPaths({
      graph,
      startNodeIds: new Set([nodes.start.id]),
      allocatedNodeIds: new Set(),
    });

    const path = materializePath(nodes.third.id, predecessorByNodeId);

    expect(path).toEqual([nodes.start.id, nodes.first.id, nodes.second.id, nodes.third.id]);
  });

  it("returns single-node path for a root node", () => {
    const { graph, nodes } = makeLineGraph();

    const { predecessorByNodeId } = computeWeightedPaths({
      graph,
      startNodeIds: new Set([nodes.start.id]),
      allocatedNodeIds: new Set(),
    });

    const path = materializePath(nodes.start.id, predecessorByNodeId);

    expect(path).toEqual([nodes.start.id]);
  });
});
