import { describe, expect, it } from "vitest";
import { makeLineGraph } from "../../__tests__/PassiveGraph.fixtures";
import { getClassStartNodeIds } from "../getClassStartNodeIds";

describe("getClassStartNodeIds", () => {
  it("returns empty set when classId is null — regardless of graph content", () => {
    const { graph } = makeLineGraph();
    const result = getClassStartNodeIds(graph, null);
    expect(result).toEqual(new Set());
  });

  it("returns empty set when classId does not exist", () => {
    const { graph } = makeLineGraph();
    const result = getClassStartNodeIds(graph, 999);
    expect(result).toEqual(new Set());
  });

  it("returns the correct start node IDs for a known classId", () => {
    const { graph, nodes } = makeLineGraph();

    expect(getClassStartNodeIds(graph, 1)).toEqual(
      new Set([nodes.start.id, nodes.startOtherClass.id]),
    );
  });
});
