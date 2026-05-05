import {
  buildGraph,
  makeForkGraph,
  makeLineGraph,
  makeNode,
  makeRegionGraph,
} from "@/domain/graph/__tests__/PassiveGraph.fixtures";
import { describe, expect, it } from "vitest";
import { canTraverse } from "../traversal";

describe("canTraverse", () => {
  it("cannot move to a classStart node", () => {
    const graph = makeLineGraph();

    const source = graph.nodesById.get("end")!;
    const target = graph.nodesById.get("start")!;

    expect(canTraverse(graph, source, target)).toBe(false);
  });

  it("cannot move from and to the same node", () => {
    const graph = makeLineGraph();

    const source = graph.nodesById.get("start")!;
    const target = graph.nodesById.get("start")!;

    expect(canTraverse(graph, source, target)).toBe(false);
  });

  it("can traverse a line graph", () => {
    const graph = makeLineGraph();

    const source = graph.nodesById.get("start")!;
    const target = graph.nodesById.get("end")!;

    expect(canTraverse(graph, source, target)).toBe(true);
  });

  it("can traverse a fork graph", () => {
    const graph = makeForkGraph();

    const start = graph.nodesById.get("start")!;
    const endA = graph.nodesById.get("end-a")!;
    const endB = graph.nodesById.get("end-b")!;

    expect(canTraverse(graph, start, endA)).toBe(true);
    expect(canTraverse(graph, start, endB)).toBe(true);
    expect(canTraverse(graph, endB, endA)).toBe(true);
    expect(canTraverse(graph, endA, endB)).toBe(true);

    expect(canTraverse(graph, endA, start)).toBe(false);
  });

  it("cannot move from a mastery node", () => {
    const masteryNode = makeNode({
      id: "0",
      kind: "mastery",
    });

    const otherNode = makeNode({
      id: "1",
    });

    const graph = buildGraph({ nodes: [masteryNode, otherNode], edgePairs: [["0", "1"]] });

    expect(canTraverse(graph, masteryNode, otherNode)).toBe(false);
  });

  it("respects regions' boundaries", () => {
    const graph = makeRegionGraph();

    // region = main
    const nodeInMainRegionA = graph.nodesById.get("0")!;
    const nodeInMainRegionB = graph.nodesById.get("1")!;
    // region = ascendancy / subregion = ascendancyA
    const nodeInAscendancyRegionA = graph.nodesById.get("2")!;
    const nodeInAscendancyRegionB = graph.nodesById.get("3")!;
    // region = ascendancy / subregion = ascendancyB
    const nodeInAnotherAscendancyRegionA = graph.nodesById.get("4")!;
    const nodeInAnotherAscendancyRegionB = graph.nodesById.get("5")!;

    expect(canTraverse(graph, nodeInMainRegionA, nodeInMainRegionB)).toBe(true);
    expect(canTraverse(graph, nodeInAscendancyRegionA, nodeInAscendancyRegionB)).toBe(true);
    expect(canTraverse(graph, nodeInAnotherAscendancyRegionA, nodeInAnotherAscendancyRegionB)).toBe(
      true,
    );

    // main -> ascendancy:ascendancyA
    expect(canTraverse(graph, nodeInMainRegionA, nodeInAscendancyRegionA)).toBe(false);
    expect(canTraverse(graph, nodeInMainRegionB, nodeInAscendancyRegionA)).toBe(false);
    expect(canTraverse(graph, nodeInMainRegionA, nodeInAscendancyRegionB)).toBe(false);
    expect(canTraverse(graph, nodeInMainRegionB, nodeInAscendancyRegionB)).toBe(false);
    // main -> ascendancy:ascendancyB
    expect(canTraverse(graph, nodeInMainRegionA, nodeInAnotherAscendancyRegionA)).toBe(false);
    expect(canTraverse(graph, nodeInMainRegionB, nodeInAnotherAscendancyRegionA)).toBe(false);
    expect(canTraverse(graph, nodeInMainRegionA, nodeInAnotherAscendancyRegionB)).toBe(false);
    expect(canTraverse(graph, nodeInMainRegionB, nodeInAnotherAscendancyRegionB)).toBe(false);
    // ascendancy:ascendancyA -> ascendancy:ascendancyB
    expect(canTraverse(graph, nodeInAscendancyRegionA, nodeInAnotherAscendancyRegionA)).toBe(false);
    expect(canTraverse(graph, nodeInAscendancyRegionB, nodeInAnotherAscendancyRegionA)).toBe(false);
    expect(canTraverse(graph, nodeInAscendancyRegionA, nodeInAnotherAscendancyRegionB)).toBe(false);
    expect(canTraverse(graph, nodeInAscendancyRegionB, nodeInAnotherAscendancyRegionB)).toBe(false);
  });
});
