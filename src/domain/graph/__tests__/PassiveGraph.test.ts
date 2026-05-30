import { describe, expect, it } from "vitest";
import type { NodeId } from "../PassiveNode";
import { makeEdgeKey } from "../edgeKeys";
import {
  makeCustomAscendancyGraph,
  makeDiamondGraph,
  makeForkGraph,
  makeLineGraph,
  makeRegionGraph,
} from "./PassiveGraph.fixtures";

describe("PassiveGraph", () => {
  describe("getRootNodeIds", () => {
    it("returns empty set when classId and ascendancyId are null", () => {
      const { graph } = makeLineGraph();
      const result = graph.getBuildRootNodeIds(null, null);
      expect(result).toEqual(new Set());
    });

    it("returns allocatable nodes connected to start nodes for a valid classId", () => {
      const { graph, nodes } = makeLineGraph();
      const result = graph.getBuildRootNodeIds(1, null);
      expect(result).toEqual(new Set([nodes.first.id, nodes.sixth.id]));
    });

    it("returns allocatable nodes connected to a single start node for a valid classId", () => {
      const { graph, nodes } = makeDiamondGraph();
      const result = graph.getBuildRootNodeIds(1, null);
      expect(result).toEqual(new Set([nodes.left.first.id, nodes.right.first.id]));
    });

    it("adds allocatable nodes connected to ascendancy start nodes when ascendancy is selected", () => {
      const { graph, nodes } = makeRegionGraph();
      const result = graph.getBuildRootNodeIds(1, nodes.ascendancyA.start.ascendancyName!);
      expect(result).toEqual(new Set([nodes.main.normal.id, nodes.ascendancyA.normal.id]));
    });

    it("ignores unknown ascendancy", () => {
      const { graph, nodes } = makeRegionGraph();
      const result = graph.getBuildRootNodeIds(1, "unknown-ascendancy");
      expect(result).toEqual(new Set([nodes.main.normal.id]));
    });
  });

  describe("getClassStartNodeIds", () => {
    it("returns empty set when classId is null", () => {
      const { graph } = makeLineGraph();
      const result = graph.getClassStartNodeIds(null);
      expect(result).toEqual(new Set());
    });

    it("returns empty set when classId does not exist", () => {
      const { graph } = makeLineGraph();
      const result = graph.getClassStartNodeIds(999);
      expect(result).toEqual(new Set());
    });

    it("returns correct start node IDs for a known classId", () => {
      const { graph, nodes } = makeLineGraph();
      expect(graph.getClassStartNodeIds(1)).toEqual(
        new Set([nodes.start.id, nodes.startOtherClass.id]),
      );
    });
  });


  describe("isValidAscendancyForClass", () => {
    it("returns false when classId does not exist", () => {
      const { graph } = makeCustomAscendancyGraph();
      expect(graph.isValidAscendancyForClass(999, "whatever")).toBe(false);
    });

    it("returns false when class has no ascendancies", () => {
      const { graph, classes } = makeCustomAscendancyGraph();
      expect(graph.isValidAscendancyForClass(classes.noAscendancy, "ascendancyA")).toBe(false);
    });

    it("returns true for a valid ascendancy", () => {
      const { graph, classes } = makeCustomAscendancyGraph();
      expect(graph.isValidAscendancyForClass(classes.oneAscendancy, "ascendancyA")).toBe(true);
    });

    it("returns false for unknown ascendancy when class has multiple valid ones", () => {
      const { graph, classes } = makeCustomAscendancyGraph();
      expect(graph.isValidAscendancyForClass(classes.twoAscendancies, "unknown")).toBe(false);
    });

    it("returns false for invalid ascendancy when class has multiple valid ones", () => {
      const { graph, classes } = makeCustomAscendancyGraph();
      expect(
        graph.isValidAscendancyForClass(
          classes.twoAscendancies,
          "ascendancyA" /* this class doesn't have this one */,
        ),
      ).toBe(false);
    });

    it("returns true for each valid ascendancy when class has multiple defined", () => {
      const { graph, classes } = makeCustomAscendancyGraph();

      expect(graph.isValidAscendancyForClass(classes.twoAscendancies, "ascendancyB")).toBe(true);
      expect(graph.isValidAscendancyForClass(classes.twoAscendancies, "ascendancyC")).toBe(true);
    });
  });

  describe("computeEdgeKeysFromNodeIds", () => {
    it("returns empty set when nodeIds is empty", () => {
      const { graph } = makeLineGraph();
      const result = graph.computeEdgeKeysFromNodeIds(new Set<NodeId>());
      expect(result).toEqual(new Set());
    });

    it("returns empty set when no edge has both endpoints in nodeIds", () => {
      const { graph } = makeLineGraph();
      const nodeIds = new Set(["notInGraph1", "notInGraph2"]);
      const result = graph.computeEdgeKeysFromNodeIds(nodeIds);
      expect(result).toEqual(new Set());
    });

    it("returns empty set both nodes are not connected", () => {
      const { graph, nodes } = makeLineGraph();
      const nodeIds = new Set([nodes.start.id, nodes.third.id]);
      const result = graph.computeEdgeKeysFromNodeIds(nodeIds);
      expect(result).toEqual(new Set());
    });

    it("returns matching edge key when both endpoints are connected", () => {
      const { graph, nodes } = makeLineGraph();
      const nodeIds = new Set([nodes.start.id, nodes.first.id]);
      const result = graph.computeEdgeKeysFromNodeIds(nodeIds);
      expect(result).toEqual(new Set([makeEdgeKey(nodes.start.id, nodes.first.id)]));
    });

    it("returns only edges where both endpoints are connected", () => {
      const { graph, nodes } = makeLineGraph();
      const nodeIds = new Set([nodes.first.id, nodes.second.id, nodes.third.id]);
      const result = graph.computeEdgeKeysFromNodeIds(nodeIds);
      expect(result).toEqual(
        new Set([
          makeEdgeKey(nodes.first.id, nodes.second.id),
          makeEdgeKey(nodes.second.id, nodes.third.id),
        ]),
      );
    });

    it("returns all edge keys when nodeIds covers all nodes", () => {
      const { graph, nodes, edgePairs } = makeLineGraph();
      const nodeIds = new Set(Object.values(nodes).map((n) => n.id));
      const result = graph.computeEdgeKeysFromNodeIds(nodeIds);
      const expectedEdgeKeys = new Set(edgePairs.map(([aId, bId]) => makeEdgeKey(aId, bId)));
      expect(result).toEqual(expectedEdgeKeys);
    });

    it("returns edges from a fork graph when selecting central and one branch", () => {
      const { graph, nodes } = makeForkGraph();
      const nodeIds = new Set([nodes.start.id, nodes.first.id, nodes.left.first.id]);
      const result = graph.computeEdgeKeysFromNodeIds(nodeIds);
      expect(result).toEqual(
        new Set([
          makeEdgeKey(nodes.start.id, nodes.first.id),
          makeEdgeKey(nodes.first.id, nodes.left.first.id),
        ]),
      );
    });

    it("returns edges from a diamond graph when selecting partial nodes", () => {
      const { graph, nodes } = makeDiamondGraph();
      const nodeIds = new Set([
        nodes.start.id,
        nodes.right.first.id,
        nodes.left.first.id,
        nodes.end.id,
      ]);
      const result = graph.computeEdgeKeysFromNodeIds(nodeIds);
      expect(result).toEqual(
        new Set([
          makeEdgeKey(nodes.start.id, nodes.left.first.id),
          makeEdgeKey(nodes.start.id, nodes.right.first.id),
          makeEdgeKey(nodes.left.first.id, nodes.end.id),
        ]),
      );
    });
  });
});
