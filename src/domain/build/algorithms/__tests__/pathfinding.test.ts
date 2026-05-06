import {
  buildGraph,
  makeDiamondGraph,
  makeLineGraph,
  makeNode,
} from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import { describe, expect, it } from "vitest";
import { computeWeightedPaths } from "../pathfinding.ts";

describe("computeWeightedPaths", () => {
  it("root nodes have distance 0 and no predecessor", () => {
    const { graph, nodes } = makeLineGraph();

    const { distanceByNodeId, predecessorByNodeId } = computeWeightedPaths({
      graph,
      rootNodeIds: new Set([nodes.start.id]),
      allocatedNodeIds: new Set(),
    });

    expect(distanceByNodeId.get(nodes.start.id)).toBe(0);
    expect(predecessorByNodeId.get(nodes.start.id)).toBeNull();
  });

  it("multiple roots all start at distance 0", () => {
    const { graph, nodes } = makeLineGraph();

    const { distanceByNodeId } = computeWeightedPaths({
      graph,
      rootNodeIds: new Set([nodes.start.id, nodes.sixth.id]),
      allocatedNodeIds: new Set(),
    });

    expect(distanceByNodeId.get(nodes.start.id)).toBe(0);
    expect(distanceByNodeId.get(nodes.sixth.id)).toBe(0);
  });

  it("each unallocated hop costs 1", () => {
    const { graph, nodes } = makeLineGraph();

    const { distanceByNodeId } = computeWeightedPaths({
      graph,
      rootNodeIds: new Set([nodes.start.id]),
      allocatedNodeIds: new Set(),
    });

    expect(distanceByNodeId.get(nodes.first.id)).toBe(1);
    expect(distanceByNodeId.get(nodes.second.id)).toBe(2);
    expect(distanceByNodeId.get(nodes.third.id)).toBe(3);
  });

  it("allocated nodes cost 0", () => {
    const { graph, nodes } = makeLineGraph();

    // first and second are already allocated — they cost 0 to traverse
    const { distanceByNodeId } = computeWeightedPaths({
      graph,
      rootNodeIds: new Set([nodes.start.id]),
      allocatedNodeIds: new Set([nodes.first.id, nodes.second.id]),
    });

    expect(distanceByNodeId.get(nodes.first.id)).toBe(0);
    expect(distanceByNodeId.get(nodes.second.id)).toBe(0);
    // third is unallocated — costs 1 from second
    expect(distanceByNodeId.get(nodes.third.id)).toBe(1);
  });

  it("a gap of unallocated nodes in an otherwise allocated chain accumulates correctly", () => {
    const { graph, nodes } = makeLineGraph();

    // start -- first(alloc) -- second(unalloc) -- third(unalloc) -- fourth(alloc) --
    // fith(unalloc) -- sixth(unalloc )
    const { distanceByNodeId } = computeWeightedPaths({
      graph,
      rootNodeIds: new Set([nodes.start.id]),
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
      rootNodeIds: new Set([nodes.start.id, nodes.sixth.id]),
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

  // ─── Shortest path preference ────────────────────────────────────────────────

  it("diamond: picks the shorter path to the convergence node", () => {
    const { graph, nodes } = makeDiamondGraph();

    // start -- left-1 -- end (2 hops)
    //       -- right-1 -- right-2 -- end (3 hops)
    // BFS should prefer left path to end
    const { distanceByNodeId, predecessorByNodeId } = computeWeightedPaths({
      graph,
      rootNodeIds: new Set([nodes.start.id]),
      allocatedNodeIds: new Set(),
    });

    expect(distanceByNodeId.get(nodes.end.id)).toBe(2);
    expect(predecessorByNodeId.get(nodes.end.id)).toBe(nodes.left.first.id);
  });

  it("diamond: prefers path through allocated nodes even when it is longer in hops", () => {
    const { graph, nodes } = makeDiamondGraph();

    // start -- left-1 -- end
    //       -- right-1 -- right-2 -- end
    //
    // right-1 and right-2 are allocated (cost 0 each)
    // left path cost:  1 (left-1) + 1 (end) = 2
    // right path cost: 0 (right-1) + 0 (right-2) + 1 (end) = 1
    // right path is cheaper despite more hops
    const { distanceByNodeId, predecessorByNodeId } = computeWeightedPaths({
      graph,
      rootNodeIds: new Set([nodes.start.id]),
      allocatedNodeIds: new Set([nodes.right.first.id, nodes.right.second.id]),
    });

    expect(distanceByNodeId.get(nodes.end.id)).toBe(1);
    expect(predecessorByNodeId.get(nodes.end.id)).toBe(nodes.right.second.id);
  });

  // ─── Unreachable nodes ───────────────────────────────────────────────────────

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
      rootNodeIds: new Set([root.id]),
      allocatedNodeIds: new Set(),
    });

    expect(distanceByNodeId.has(island.id)).toBe(false);
  });
});

describe("materializePath", () => {});
