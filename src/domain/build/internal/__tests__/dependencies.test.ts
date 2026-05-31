import { describe, expect, it } from "vitest";
import {
  buildGraph,
  makeDiamondGraph,
  makeForkGraph,
  makeLineGraph,
  makeNode,
} from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import type { NodeId } from "@/domain/graph/PassiveNode.ts";
import { computeDependencies } from "../dependencies.ts";

describe("computeDependencies", () => {
  it("ignores start nodes", () => {
    const { graph, nodes } = makeLineGraph();

    const startNodeIds = new Set([nodes.start.id]);
    const allocatedNodeIds = new Set([nodes.first.id, nodes.second.id, nodes.third.id]);

    const { dependsOnByNodeId, requiredByNodeId } = computeDependencies({
      graph,
      allocatedNodeIds,
      startNodeIds,
    });

    // start is not tracked as a candidate — no entry in either map
    expect(requiredByNodeId.has(nodes.start.id)).toBe(false);

    // no allocated node lists the start as something it depends on
    for (const allocatedNodeId of allocatedNodeIds) {
      expect(dependsOnByNodeId.get(allocatedNodeId)!.has(nodes.start.id)).toBe(false);
    }
  });

  it("computes dependencies in a line graph", () => {
    const { graph, nodes } = makeLineGraph();
    const allocatedNodeIds = new Set([nodes.first.id, nodes.second.id, nodes.third.id]);

    const result = computeDependencies({
      graph,
      allocatedNodeIds,
      startNodeIds: new Set([nodes.start.id]),
    });

    // second depends on first
    expect(result.dependsOnByNodeId.get(nodes.second.id)?.has(nodes.first.id)).toBe(true);
    // third depends on second
    expect(result.dependsOnByNodeId.get(nodes.third.id)?.has(nodes.second.id)).toBe(true);
    // first has no dependencies (connected to start node)
    expect(result.dependsOnByNodeId.get(nodes.first.id)?.size).toBe(0);
  });

  it("handles diamond graph: no dependencies (cycle provides alternative paths)", () => {
    const { graph, nodes } = makeDiamondGraph();
    const allocatedNodeIds = new Set([
      nodes.left.first.id,
      nodes.right.first.id,
      nodes.right.second.id,
      nodes.end.id,
    ]);

    const result = computeDependencies({
      graph,
      allocatedNodeIds,
      startNodeIds: new Set([nodes.start.id]),
    });

    // Diamond forms a cycle: start → left-1 → end → right-2 → right-1 → start
    // Removing any single allocated node still leaves all others reachable
    for (const nodeId of allocatedNodeIds) {
      expect(result.dependsOnByNodeId.get(nodeId)?.size).toBe(0);
    }
  });

  it("handles fork graph: each branch depends on common ancestor", () => {
    const { graph, nodes } = makeForkGraph();
    const allocatedNodeIds = new Set([
      nodes.first.id,
      nodes.left.first.id,
      nodes.left.second.id,
      nodes.right.first.id,
      nodes.right.second.id,
    ]);

    const result = computeDependencies({
      graph,
      allocatedNodeIds,
      startNodeIds: new Set([nodes.start.id]),
    });

    // left branch depends on first
    expect(result.dependsOnByNodeId.get(nodes.left.first.id)?.has(nodes.first.id)).toBe(true);
    // right branch depends on first
    expect(result.dependsOnByNodeId.get(nodes.right.first.id)?.has(nodes.first.id)).toBe(true);
    // left.second depends on left.first
    expect(result.dependsOnByNodeId.get(nodes.left.second.id)?.has(nodes.left.first.id)).toBe(true);
    // right.second depends on right.first
    expect(result.dependsOnByNodeId.get(nodes.right.second.id)?.has(nodes.right.first.id)).toBe(true);
  });

  it("diamond: neither side-path node requires the other", () => {
    const { graph, nodes } = makeDiamondGraph();

    const allocatedNodeIds = new Set([
      nodes.left.first.id,
      nodes.right.first.id,
      nodes.right.second.id,
      nodes.end.id,
    ]);
    const startNodeIds = new Set([nodes.start.id]);

    const { requiredByNodeId } = computeDependencies({
      graph,
      allocatedNodeIds,
      startNodeIds,
    });

    // removing left-1 still leaves end reachable via right path — so end does NOT require left-1
    expect(requiredByNodeId.get(nodes.left.first.id)?.has(nodes.end.id)).toBe(false);

    // removing right-1 cuts right-2 (dead end), but end is still reachable via left — so end does NOT require right-1
    expect(requiredByNodeId.get(nodes.right.first.id)?.has(nodes.end.id)).toBe(false);

    // removing right-2 cuts nobody else — end is still reachable via left
    expect(requiredByNodeId.get(nodes.right.second.id)?.size).toBe(0);
  });

  it("diamond: end node requires both paths only when one is already missing", () => {
    const { graph, nodes } = makeDiamondGraph();
    // Only left path allocated — right path absent
    // start -- left-1 -- end
    const startNodeIds = new Set([nodes.start.id]);
    const allocatedNodeIds = new Set([nodes.left.first.id, nodes.end.id]);

    const { requiredByNodeId } = computeDependencies({
      graph,
      allocatedNodeIds,
      startNodeIds,
    });

    // Now left-1 is the only path to end — "end" IS dependent on left-1
    expect(requiredByNodeId.get(nodes.left.first.id)?.has(nodes.end.id)).toBe(true);
  });

  it("fork: removing the branching node disconnects both branches", () => {
    const { graph, nodes } = makeForkGraph();
    const allocatedNodeIds = new Set<NodeId>([
      nodes.first.id,
      nodes.left.first.id,
      nodes.left.second.id,
      nodes.right.first.id,
      nodes.right.second.id,
    ]);
    const startNodeIds = new Set([nodes.start.id]);

    const { requiredByNodeId } = computeDependencies({
      graph,
      allocatedNodeIds,
      startNodeIds,
    });

    // removing first (the fork node) disconnects all four branch nodes
    expect(requiredByNodeId.get(nodes.first.id)).toEqual(
      new Set([
        nodes.left.first.id,
        nodes.left.second.id,
        nodes.right.first.id,
        nodes.right.second.id,
      ]),
    );
  });

  it("fork: removing one branch leaf only affects that leaf", () => {
    const { graph, nodes } = makeForkGraph();
    const allocatedNodeIds = new Set<NodeId>([
      nodes.first.id,
      nodes.left.first.id,
      nodes.left.second.id,
      nodes.right.first.id,
      nodes.right.second.id,
    ]);
    const startNodeIds = new Set([nodes.start.id]);

    const { requiredByNodeId } = computeDependencies({
      graph,
      allocatedNodeIds,
      startNodeIds,
    });

    // removing left-second (a leaf) disconnects nobody else
    expect(requiredByNodeId.get(nodes.left.second.id)?.size).toBe(0);
  });

  it("node reachable from two start nodes has no single dependency", () => {
    // Two separate start nodes both connected to a shared middle node
    // start-a -- middle -- leaf
    // start-b -
    const startA = makeNode({ id: "start-a", kind: "classStart" });
    const startB = makeNode({ id: "start-b", kind: "classStart" });
    const middle = makeNode({ id: "middle" });
    const leaf = makeNode({ id: "leaf" });

    const graph = buildGraph({
      nodes: [startA, startB, middle, leaf],
      edgePairs: [
        [startA.id, middle.id],
        [startB.id, middle.id],
        [middle.id, leaf.id],
      ],
    });

    // starts are excluded from allocatedNodeIds — computeDependencies handles them separately
    const allocatedNodeIds = new Set([middle.id, leaf.id]);
    const startNodeIds = new Set([startA.id, startB.id]);

    const { dependsOnByNodeId, requiredByNodeId } = computeDependencies({
      graph,
      allocatedNodeIds,
      startNodeIds,
    });

    // middle is reachable from both starts — it depends on nothing
    expect(dependsOnByNodeId.get(middle.id)?.size).toBe(0);

    // removing middle disconnects leaf — leaf requires middle
    expect(requiredByNodeId.get(middle.id)?.has(leaf.id)).toBe(true);

    // leaf's only path to the tree is through middle
    expect(dependsOnByNodeId.get(leaf.id)?.has(middle.id)).toBe(true);
  });
});
