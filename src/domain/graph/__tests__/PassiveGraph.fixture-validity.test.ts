import { describe, expect, it } from "vitest";
import {
  makeLineGraph,
  makeForkGraph,
  makeDiamondGraph,
  makeRegionGraph,
  makeCustomAscendancyGraph,
} from "./PassiveGraph.fixtures";

describe("fixture functions produce valid graphs", () => {
  it("makeLineGraph produces a valid graph", () => {
    const { graph, nodes } = makeLineGraph();
    expect(graph.nodesById.size).toBe(8);
    expect(nodes.start.kind).toBe("classStart");
    expect(nodes.start.classStartIndex).toBe(1);
    expect(nodes.first.kind).toBe("normal");
    expect(nodes.sixth.kind).toBe("normal");
    expect(nodes.startOtherClass.kind).toBe("classStart");
    expect(nodes.startOtherClass.classStartIndex).toBe(1);
  });

  it("makeForkGraph produces a valid graph", () => {
    const { graph, nodes } = makeForkGraph();
    expect(graph.nodesById.size).toBe(6);
    expect(nodes.start.kind).toBe("classStart");
    expect(nodes.first.kind).toBe("normal");
    expect(nodes.left.first.kind).toBe("normal");
    expect(nodes.right.first.kind).toBe("normal");
  });

  it("makeDiamondGraph produces a valid graph", () => {
    const { graph, nodes } = makeDiamondGraph();
    expect(graph.nodesById.size).toBe(5);
    expect(nodes.start.kind).toBe("classStart");
    expect(nodes.left.first.kind).toBe("normal");
    expect(nodes.end.kind).toBe("normal");
  });

  it("makeRegionGraph produces a valid graph with regions", () => {
    const { graph, nodes } = makeRegionGraph();
    expect(graph.nodesById.size).toBe(8);
    expect(nodes.main.start.kind).toBe("classStart");
    expect(nodes.ascendancyA.start.kind).toBe("ascendancyStart");
    expect(nodes.ascendancyA.start.ascendancyName).toBe("ascendancyA");
    expect(nodes.ascendancyB.start.kind).toBe("ascendancyStart");
    expect(nodes.ascendancyC.start.kind).toBe("ascendancyStart");
  });

  it("makeCustomAscendancyGraph produces a valid graph with custom class-ascendancy mappings", () => {
    const { graph, classes } = makeCustomAscendancyGraph();
    expect(graph.nodesById.size).toBe(8);
    expect(classes.noAscendancy).toBe(1);
    expect(classes.oneAscendancy).toBe(2);
    expect(classes.twoAscendancies).toBe(3);
    expect(graph.isValidAscendancyForClass(classes.oneAscendancy, "ascendancyA")).toBe(true);
    expect(graph.isValidAscendancyForClass(classes.noAscendancy, "ascendancyA")).toBe(false);
  });
});
