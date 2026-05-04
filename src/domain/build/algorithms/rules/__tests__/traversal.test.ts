import {
  buildGraph,
  makeForkGraph,
  makeLineGraph,
  makeNode,
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

    const graph = buildGraph([masteryNode, otherNode], [["0", "1"]]);

    expect(canTraverse(graph, masteryNode, otherNode)).toBe(false);
  });
});
