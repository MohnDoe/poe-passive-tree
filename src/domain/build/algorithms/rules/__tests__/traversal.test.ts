import { describe, expect, it } from "vitest";
import {
  buildGraph,
  makeLineGraph,
  makeNode,
  makeRegionGraph,
} from "@/domain/graph/__tests__/PassiveGraph.fixtures";
import { isTraversableEdge, canExpandTo, isAscendancyTraversalNode } from "../traversal";
import type { NodeId, PassiveNodeRegion, PassiveNodeSubregion } from "@/domain/graph/PassiveNode";

describe("canExpandTo", () => {
  it("returns false when source and target are the same node", () => {
    const { graph, nodes } = makeLineGraph();
    const node = nodes.first;

    expect(canExpandTo(graph, node, node)).toBe(false);
  });

  it("returns false when the edge is structurally illegal", () => {
    const region = makeRegionGraph();

    const allowedFrom = region.nodes.ascendancyA.start;
    const allowedTo = region.nodes.ascendancyA.normal;
    const blockedTo = region.nodes.ascendancyB.start;

    expect(canExpandTo(region.graph, allowedFrom, allowedTo)).toBe(true);
    expect(canExpandTo(region.graph, allowedFrom, blockedTo)).toBe(false);
  });
});

describe("isTraversableEdge", () => {
  it("returns false when moving from a mastery node", () => {
    const masteryNode = makeNode({
      id: "0",
      kind: "mastery",
    });

    const otherNode = makeNode({
      id: "1",
    });

    const graph = buildGraph({ nodes: [masteryNode, otherNode], edgePairs: [["0", "1"]] });

    expect(isTraversableEdge(graph, masteryNode, otherNode)).toBe(false);
  });

  it("returns true when moving to a mastery node", () => {
    const masteryNode = makeNode({
      id: "0",
    });

    const otherNode = makeNode({
      id: "1",
      kind: "mastery",
    });

    const graph = buildGraph({ nodes: [masteryNode, otherNode], edgePairs: [["0", "1"]] });

    expect(isTraversableEdge(graph, masteryNode, otherNode)).toBe(true);
  });

  it("returns false when moving to a classStart node", () => {
    const { graph, nodes } = makeLineGraph();

    const source = nodes.first;
    const target = nodes.start;

    expect(isTraversableEdge(graph, source, target)).toBe(false);
  });

  it("returns true when moving from a classStart node", () => {
    const { graph, nodes } = makeLineGraph();

    const source = nodes.start;
    const target = nodes.first;

    expect(isTraversableEdge(graph, source, target)).toBe(true);
  });

  it("returns true for two nodes in the main region", () => {
    const region = makeRegionGraph();

    const source = region.nodes.main.start;
    const target = region.nodes.main.normal;

    expect(isTraversableEdge(region.graph, source, target)).toBe(true);
  });

  it("returns false when moving to an ascendancyStart node", () => {
    const ascendancyStart = makeNode({
      id: "asc-start",
      kind: "ascendancyStart",
    });

    const ascendancyNode = makeNode({
      id: "asc-1",
    });

    const regionByNodeId = new Map<NodeId, PassiveNodeRegion>([
      ["asc-start", "ascendancy"],
      ["asc-1", "ascendancy"],
    ]);

    const subregionByNodeId = new Map<NodeId, PassiveNodeSubregion>([
      ["asc-start", "juggernaut"],
      ["asc-1", "juggernaut"],
    ]);

    const graph = buildGraph({
      nodes: [ascendancyStart, ascendancyNode],
      edgePairs: [["asc-start", "asc-1"]],
      regionByNodeId,
      subregionByNodeId,
    });

    expect(isTraversableEdge(graph, ascendancyNode, ascendancyStart)).toBe(false);
  });

  it("returns false when moving between different regions", () => {
    const region = makeRegionGraph();

    const from = region.nodes.main.start;
    const to = region.nodes.ascendancyA.normal;

    expect(isTraversableEdge(region.graph, from, to)).toBe(false);
  });

  it("returns true when moving within the same ascendancy subregion", () => {
    const region = makeRegionGraph();

    const from = region.nodes.ascendancyA.start;
    const to = region.nodes.ascendancyA.normal;

    expect(isTraversableEdge(region.graph, from, to)).toBe(true);
  });

  it("returns false when moving between different ascendancy subregions", () => {
    const { graph, nodes } = makeRegionGraph();

    const from = nodes.ascendancyA.normal;
    const to = nodes.ascendancyB.normal;

    expect(isTraversableEdge(graph, from, to)).toBe(false);
  });

  it("returns false when one node has no region mapping", () => {
    const a = makeNode({ id: "a" });
    const b = makeNode({ id: "b" });

    const graph = buildGraph({
      nodes: [a, b],
      edgePairs: [["a", "b"]],
      regionByNodeId: new Map([["a", "main"]]),
      subregionByNodeId: new Map([
        ["a", null],
        ["b", null],
      ]),
    });

    expect(isTraversableEdge(graph, a, b)).toBe(false);
  });
});

describe("isAscendancyTraversalNode", () => {
  it("returns false for jewel socket", () => {
    const node = makeNode({
      id: "0",
      kind: "jewel",
    });

    expect(isAscendancyTraversalNode(node)).toBe(false);
  });

  it("returns true for ascendancyStart node", () => {
    const node = makeNode({ id: "0", kind: "ascendancyStart" });
    expect(isAscendancyTraversalNode(node)).toBe(true);
  });

  it("returns true for multiple choice node", () => {
    const node = makeNode({ id: "0", isMultipleChoice: true });
    expect(isAscendancyTraversalNode(node)).toBe(true);
  });

  it("returns true for multiple choice option node", () => {
    const node = makeNode({ id: "0", isMultipleChoiceOption: true });
    expect(isAscendancyTraversalNode(node)).toBe(true);
  });

  it("returns true for proxy node", () => {
    const node = makeNode({ id: "0", kind: "proxy" });
    expect(isAscendancyTraversalNode(node)).toBe(true);
  });

  it("returns true if ascendancyName is provided", () => {
    const node = makeNode({ id: "0", ascendancyName: "juggernaut" });
    expect(isAscendancyTraversalNode(node)).toBe(true);
  });
});
