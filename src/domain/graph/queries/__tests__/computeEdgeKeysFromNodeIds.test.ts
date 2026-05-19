import { describe, expect, it } from "vitest";
import {
  makeDiamondGraph,
  makeForkGraph,
  makeLineGraph,
} from "../../__tests__/PassiveGraph.fixtures";
import type { NodeId } from "../../PassiveNode";
import { computeEdgeKeysFromNodeIds } from "../computeEdgeKeysFromNodeIds";
import { makeEdgeKey } from "../../edgeKeys";

describe("computeEdgeKeysFromNodeIds", () => {
  it("returns empty set for empty graph", () => {
    const { graph, nodes } = makeLineGraph();
    // Override to create an empty graph
    const emptyGraph = {
      ...graph,
      edges: [],
    };
    const nodeIds = new Set([nodes.start.id, nodes.first.id]);
    const result = computeEdgeKeysFromNodeIds(emptyGraph, nodeIds);
    expect(result).toEqual(new Set());
  });

  it("returns empty set when nodeIds is empty", () => {
    const { graph } = makeLineGraph();
    const nodeIds = new Set<NodeId>();
    const result = computeEdgeKeysFromNodeIds(graph, nodeIds);
    expect(result).toEqual(new Set());
  });

  it("returns empty set when no edge has both endpoints in nodeIds", () => {
    const { graph, nodes } = makeLineGraph();
    // Only select nodes that are not connected to each other
    const nodeIds = new Set([nodes.start.id, nodes.third.id]);
    const result = computeEdgeKeysFromNodeIds(graph, nodeIds);
    expect(result).toEqual(new Set());
  });

  it("returns matching edge key when both endpoints are in nodeIds", () => {
    const { graph, nodes } = makeLineGraph();
    const nodeIds = new Set([nodes.start.id, nodes.first.id]);
    const result = computeEdgeKeysFromNodeIds(graph, nodeIds);

    expect(result).toEqual(new Set(["1-start"]));
  });

  it("returns only edges where both endpoints match", () => {
    const { graph, nodes } = makeLineGraph();
    // Select nodes that form a chain: 1 -- 2 -- 3
    const nodeIds = new Set([nodes.first.id, nodes.second.id, nodes.third.id]);
    const result = computeEdgeKeysFromNodeIds(graph, nodeIds);
    expect(result).toEqual(
      new Set([
        makeEdgeKey(nodes.first.id, nodes.second.id),
        makeEdgeKey(nodes.second.id, nodes.third.id),
      ]),
    );
  });

  it("returns all edges keys when nodeIds covers all nodes", () => {
    const { graph, nodes, edgePairs } = makeLineGraph();
    const nodeIds = new Set(Object.values(nodes).map((n) => n.id));
    const result = computeEdgeKeysFromNodeIds(graph, nodeIds);

    const expectedEdgeKeys = new Set(edgePairs.map(([aId, bId]) => makeEdgeKey(aId, bId)));

    expect(result).toEqual(expectedEdgeKeys);
  });

  it("returns edges from a fork graph when selecting central and one branch", () => {
    const { graph, nodes } = makeForkGraph();
    // Select start, first (central), and left branch but not right
    const nodeIds = new Set([nodes.start.id, nodes.first.id, nodes.left.first.id]);
    const result = computeEdgeKeysFromNodeIds(graph, nodeIds);
    expect(result).toEqual(
      new Set([
        makeEdgeKey(nodes.start.id, nodes.first.id),
        makeEdgeKey(nodes.first.id, nodes.left.first.id),
      ]),
    );
  });

  it("returns edges from a diamond graph when selecting partial nodes", () => {
    const { graph, nodes } = makeDiamondGraph();
    // Select start, left path, and end but not right path fully
    const nodeIds = new Set([nodes.start.id, nodes.left.first.id, nodes.end.id]);
    const result = computeEdgeKeysFromNodeIds(graph, nodeIds);

    expect(result).toEqual(
      new Set([
        makeEdgeKey(nodes.start.id, nodes.left.first.id),
        makeEdgeKey(nodes.left.first.id, nodes.end.id),
      ]),
    );
  });
});
