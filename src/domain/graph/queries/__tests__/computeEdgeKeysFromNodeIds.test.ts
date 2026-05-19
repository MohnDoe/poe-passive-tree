import { describe, expect, it } from "vitest";
import {
  makeDiamondGraph,
  makeForkGraph,
  makeLineGraph,
} from "../../__tests__/PassiveGraph.fixtures";
import type { NodeId } from "../../PassiveNode";
import { computeEdgeKeysFromNodeIds } from "../computeEdgeKeysFromNodeIds";

describe("computeEdgeKeysFromNodeIds", () => {
  it("returns empty set for empty graph", () => {
    const { graph } = makeLineGraph();
    // Override to create an empty graph
    const emptyGraph = {
      ...graph,
      edges: [],
    };
    const nodeIds = new Set(["start", "1"]);
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
    const { graph } = makeLineGraph();
    // Only select nodes that are not connected to each other
    const nodeIds = new Set(["start", "3"]);
    const result = computeEdgeKeysFromNodeIds(graph, nodeIds);
    expect(result).toEqual(new Set());
  });

  it("returns matching edge key when both endpoints are in nodeIds", () => {
    const { graph } = makeLineGraph();
    const nodeIds = new Set(["start", "1"]);
    const result = computeEdgeKeysFromNodeIds(graph, nodeIds);

    expect(result).toEqual(new Set(["1-start"]));
  });

  it("returns only edges where both endpoints match", () => {
    const { graph } = makeLineGraph();
    // Select nodes that form a chain: 1 -- 2 -- 3
    const nodeIds = new Set(["1", "2", "3"]);
    const result = computeEdgeKeysFromNodeIds(graph, nodeIds);
    expect(result).toEqual(new Set(["1-2", "2-3"]));
  });

  it("returns all edges keys when nodeIds covers all nodes", () => {
    const { graph } = makeLineGraph();
    const nodeIds = new Set<NodeId>(["start", "1", "2", "3", "4", "5", "6"]);
    const result = computeEdgeKeysFromNodeIds(graph, nodeIds);
    // Edge keys are sorted numerically
    expect(result).toEqual(new Set(["1-start", "1-2", "2-3", "3-4", "4-5", "5-6"]));
  });

  it("returns edges from a fork graph when selecting central and one branch", () => {
    const { graph } = makeForkGraph();
    // Select start, first (central), and left branch but not right
    const nodeIds = new Set(["start", "1", "left-1"]);
    const result = computeEdgeKeysFromNodeIds(graph, nodeIds);
    expect(result).toEqual(new Set(["1-start", "left-1-1"]));
  });

  it("returns edges from a diamond graph when selecting partial nodes", () => {
    const { graph } = makeDiamondGraph();
    // Select start, left path, and end but not right path fully
    const nodeIds = new Set(["start", "left-1", "end"]);
    const result = computeEdgeKeysFromNodeIds(graph, nodeIds);
    expect(result).toEqual(new Set(["left-1-start", "end-left-1"]));
  });
});
