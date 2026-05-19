import { describe, expect, it } from "vitest";
import type { PassiveGraph } from "../../PassiveGraph";
import {
  buildGraph,
  makeLineGraph,
  makeNode,
  makeRegionGraph,
} from "../../__tests__/PassiveGraph.fixtures";
import { getActiveRootNodeIds } from "../getActiveRootNodeIds";

describe("getActiveRootNodeIds", () => {
  function makeCustomClassGraph(): PassiveGraph {
    return buildGraph({
      nodes: [
        makeNode({ id: "class-start", kind: "classStart", classStartIndex: 1 }),
        makeNode({ id: "normal-0" }),
      ],
      edgePairs: [["class-start", "normal-0"]],
    });
  }

  it("returns empty set when both classId and ascendancy are null", () => {
    const graph = makeCustomClassGraph();
    const result = getActiveRootNodeIds(graph, null, null);
    expect(result).toEqual(new Set());
  });

  it("returns only class start nodes when ascendancy is null", () => {
    const { graph, nodes } = makeLineGraph();
    const result = getActiveRootNodeIds(graph, 1, null);

    expect(result).toEqual(new Set([nodes.start.id]));
  });

  it("returns only class start nodes when provided ascendancy is unknown", () => {
    const graph = makeCustomClassGraph();
    const result = getActiveRootNodeIds(graph, 1, "unknown-ascendancy");
    expect(result).toEqual(new Set(["class-start"]));
  });

  it("returns class start nodes + ascendancy start nodes when both are active", () => {
    const { graph, nodes } = makeRegionGraph();

    const result = getActiveRootNodeIds(graph, 1, nodes.ascendancyA.start.ascendancyName!);

    expect(result).toEqual(new Set([nodes.main.start.id, nodes.ascendancyA.start.id]));
  });
});
