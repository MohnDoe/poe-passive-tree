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
import type { NodeId } from "@/domain/graph/PassiveNode.ts";

describe("computeWeightedPaths", () => {
  it("root nodes have distance 0 and no predecessor", () => {
    const { graph, nodes } = makeLineGraph();

    const { distanceByNodeId, predecessorByNodeId } = computeWeightedPaths({
      graph,
      startNodeIds: new Set([nodes.start.id]),
      allocatedNodeIds: new Set(),
    });

    expect(distanceByNodeId.get(nodes.start.id)).toBe(0);
    expect(predecessorByNodeId.get(nodes.start.id)).toBeNull();
  });

  it("multiple roots all start at distance 0", () => {
    const { graph, nodes } = makeLineGraph();

    const { distanceByNodeId } = computeWeightedPaths({
      graph,
      startNodeIds: new Set([nodes.start.id, nodes.sixth.id]),
      allocatedNodeIds: new Set(),
    });

    expect(distanceByNodeId.get(nodes.start.id)).toBe(0);
    expect(distanceByNodeId.get(nodes.sixth.id)).toBe(0);
  });

  it("costs 1 per unallocated hop", () => {
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

  it("a gap of unallocated nodes in an otherwise allocated chain accumulates correctly", () => {
    const { graph, nodes } = makeLineGraph();

    // start -- first(alloc) -- second(unalloc) -- third(unalloc) -- fourth(alloc) --
    // fifth(unalloc) -- sixth(unalloc)
    const { distanceByNodeId } = computeWeightedPaths({
      graph,
      startNodeIds: new Set([nodes.start.id]),
      allocatedNodeIds: new Set([nodes.first.id, nodes.fourth.id]),
    });

    expect(distanceByNodeId.get(nodes.first.id)).toBe(0);
    expect(distanceByNodeId.get(nodes.second.id)).toBe(1);
    expect(distanceByNodeId.get(nodes.third.id)).toBe(2);
    // fourth is allocated so costs 0 — but distance from root is still 2
    // (it costs 0 to step onto fourth, but second and third each cost 1)
    expect(distanceByNodeId.get(nodes.fourth.id)).toBe(2);
    // it still costs 1 to move to fifth and 1 more to move from fifth to sixth
    expect(distanceByNodeId.get(nodes.fifth.id)).toBe(3);
    expect(distanceByNodeId.get(nodes.sixth.id)).toBe(4);
  });

  it("each node is reached from its nearest root", () => {
    const { graph, nodes } = makeLineGraph();

    // start(root) -- first(alloc) -- second(unalloc) -- third(unalloc) -- fourth(unalloc) -- fifth (alloc) -- sixth (root)
    const { distanceByNodeId } = computeWeightedPaths({
      graph,
      startNodeIds: new Set([nodes.start.id, nodes.sixth.id]),
      allocatedNodeIds: new Set([nodes.first.id, nodes.fifth.id]),
    });

    expect(distanceByNodeId.get(nodes.first.id)).toBe(0);
    expect(distanceByNodeId.get(nodes.second.id)).toBe(1);
    expect(distanceByNodeId.get(nodes.third.id)).toBe(2);

    // sixth is the closest root to fourth and fifth (because from start to fourth it would cost 3)
    // going from sixth to fifth is free because fifth is allocated
    // fifth -> fourth costs 1
    expect(distanceByNodeId.get(nodes.fourth.id)).toBe(1);
    expect(distanceByNodeId.get(nodes.fifth.id)).toBe(0);
  });

  it("disconnected nodes have no entry in distanceByNodeId", () => {
    const root = makeNode({ id: "root", kind: "classStart" });
    const connected = makeNode({ id: "connected" });
    const island = makeNode({ id: "island" });

    const graph = buildGraph({
      nodes: [root, connected, island],
      edgePairs: [
        [root.id, connected.id],
        // island does not have an edge
      ],
    });

    const { distanceByNodeId } = computeWeightedPaths({
      graph,
      startNodeIds: new Set([root.id]),
      allocatedNodeIds: new Set(),
    });

    expect(distanceByNodeId.has(island.id)).toBe(false);
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

  it("returns [root, target] for a direct neighbour of root", () => {
    const predecessorByNodeId = new Map<NodeId, NodeId | null>([
      ["root", null],
      ["A", "root"],
    ]);

    expect(materializePath("A", predecessorByNodeId)).toEqual(["root", "A"]);
  });

  it("returns the full path in root → target order and nothing more", () => {
    const predecessorByNodeId = new Map<NodeId, NodeId | null>([
      ["root", null],
      ["A", "root"],
      ["B", "A"],
      ["C", "B"],
    ]);

    expect(materializePath("A", predecessorByNodeId)).toEqual(["root", "A"]);
    expect(materializePath("B", predecessorByNodeId)).toEqual(["root", "A", "B"]);
    expect(materializePath("C", predecessorByNodeId)).toEqual(["root", "A", "B", "C"]);
  });

  it("does not mutate the predecessor map", () => {
    const predecessorByNodeId = new Map<NodeId, NodeId | null>([
      ["root", null],
      ["A", "root"],
      ["B", "A"],
    ]);
    const sizeBefore = predecessorByNodeId.size;
    const entriesBefore = [...predecessorByNodeId.entries()];

    materializePath("B", predecessorByNodeId);

    expect(predecessorByNodeId.size).toBe(sizeBefore);
    expect([...predecessorByNodeId.entries()]).toEqual(entriesBefore);
  });
});
