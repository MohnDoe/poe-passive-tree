import { describe, expect, it } from "vitest";
import {
  buildGraph,
  makeDiamondGraph,
  makeForkGraph,
  makeLineGraph,
  makeNode,
} from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import type { NodeId } from "@/domain/graph/PassiveNode.ts";
import { computeConnectivity, computeDependencies } from "../dependencies.ts";

describe("computeConnectivity", () => {
  it("returns all whitelisted nodes in a simple line", () => {
    const { graph, nodes } = makeLineGraph();
    const whitelistedNodeIds = new Set([nodes.start.id, nodes.first.id, nodes.second.id]);
    const connectedNodeIds = computeConnectivity({
      graph,
      startNodeIds: new Set([nodes.start.id]),
      whitelistedNodeIds,
    });

    expect(connectedNodeIds.size).toBe(whitelistedNodeIds.size);

    const expectedNodeIds = [nodes.start.id, nodes.first.id, nodes.second.id];
    for (const expectedNodeId of expectedNodeIds) {
      expect(connectedNodeIds.has(expectedNodeId)).toBe(true);
    }
  });

  it("always includes start node(s) regardless of whitelist", () => {
    const { graph, nodes } = makeLineGraph();

    const connectedNodeIds = computeConnectivity({
      graph,
      startNodeIds: new Set([nodes.start.id]),
      whitelistedNodeIds: new Set([nodes.first.id]),
    });

    expect(connectedNodeIds.has(nodes.start.id)).toBe(true);
  });

  it("returns start node(s) when whitelist is empty", () => {
    const { graph, nodes } = makeLineGraph();

    const connectedNodeIds = computeConnectivity({
      graph,
      startNodeIds: new Set([nodes.start.id]),
      whitelistedNodeIds: new Set(),
    });

    expect(connectedNodeIds.size).toBe(1);
    expect(connectedNodeIds.has(nodes.start.id)).toBe(true);
  });

  it("cuts a chain of nodes if a link is not whitelisted", () => {
    const { graph, nodes } = makeLineGraph();

    const connectedNodeIds = computeConnectivity({
      graph,
      startNodeIds: new Set([nodes.start.id]),
      whitelistedNodeIds: new Set([nodes.first.id, nodes.third.id]),
    });

    expect(connectedNodeIds.size).toBe(2);
    expect(connectedNodeIds.has(nodes.second.id)).toBe(false);
  });

  it("reaches all branches of forked graph", () => {
    const { graph, nodes } = makeForkGraph();

    const whitelistedNodeIds = new Set<NodeId>([
      nodes.first.id,
      nodes.left.first.id,
      nodes.left.second.id,
      nodes.right.first.id,
      nodes.right.second.id,
    ]);

    const connectedNodeIds = computeConnectivity({
      graph,
      startNodeIds: new Set([nodes.start.id]),
      whitelistedNodeIds,
    });

    expect(connectedNodeIds.size).toBe(6);

    for (const whitelistedNodeId of whitelistedNodeIds) {
      expect(connectedNodeIds.has(whitelistedNodeId)).toBe(true);
    }
  });

  it("spreads from start nodes in a disconnected graph", () => {
    const { graph, nodes } = makeLineGraph();
    const connectedNodeIds = computeConnectivity({
      graph,
      startNodeIds: new Set([nodes.start.id, nodes.sixth.id]),
      // 0 -- 1 || 5 -- 6
      whitelistedNodeIds: new Set([nodes.first.id, nodes.fifth.id]),
    });

    expect(connectedNodeIds.has(nodes.second.id)).toBe(false);
    expect(connectedNodeIds.has(nodes.third.id)).toBe(false);
    expect(connectedNodeIds.has(nodes.fourth.id)).toBe(false);

    const expectedNodeIds = [nodes.first.id, nodes.fifth.id, nodes.start.id, nodes.sixth.id];
    expect(connectedNodeIds.size).toBe(expectedNodeIds.length);

    for (const expectedNodeId of expectedNodeIds) {
      expect(connectedNodeIds.has(expectedNodeId)).toBe(true);
    }
  });

  it("reaches all paths of a diamond graph", () => {
    const { graph, nodes } = makeDiamondGraph();
    const startNodeIds = new Set([nodes.start.id]);
    const whitelistedNodeIds = new Set([
      nodes.left.first.id,
      nodes.right.first.id,
      nodes.right.second.id,
      nodes.end.id,
    ]);

    const connectedNodeIds = computeConnectivity({
      graph,
      startNodeIds: startNodeIds,
      whitelistedNodeIds,
    });

    const expectedNodeIds = new Set([...startNodeIds, ...whitelistedNodeIds]);

    expect(connectedNodeIds.size).toBe(expectedNodeIds.size);

    for (const expectedNodeId of expectedNodeIds) {
      expect(connectedNodeIds.has(expectedNodeId)).toBe(true);
    }
  });

  it("still reaches convergence node of diamond graph when one path is complete", () => {
    const { graph, nodes } = makeDiamondGraph();
    const startNodeIds = new Set([nodes.start.id]);
    const whitelistedNodeIds = new Set([nodes.left.first.id, nodes.right.first.id, nodes.end.id]);

    const connectedNodeIds = computeConnectivity({
      graph,
      startNodeIds: startNodeIds,
      whitelistedNodeIds,
    });

    const expectedNodeIds = new Set([...startNodeIds, ...whitelistedNodeIds]);

    expect(connectedNodeIds.size).toBe(expectedNodeIds.size);

    for (const expectedNodeId of expectedNodeIds) {
      expect(connectedNodeIds.has(expectedNodeId)).toBe(true);
    }
  });

  it("does not reach convergence node of diamond graph if all path are incomplete", () => {
    const { graph, nodes } = makeDiamondGraph();
    const startNodeIds = new Set([nodes.start.id]);
    const whitelistedNodeIds = new Set([nodes.right.first.id, nodes.end.id]);

    const connectedNodeIds = computeConnectivity({
      graph,
      startNodeIds: startNodeIds,
      whitelistedNodeIds,
    });

    const expectedNodeIds = new Set([...startNodeIds, nodes.right.first.id]);

    expect(connectedNodeIds.size).toBe(expectedNodeIds.size);

    for (const expectedNodeId of expectedNodeIds) {
      expect(connectedNodeIds.has(expectedNodeId)).toBe(true);
    }
  });

  it("does not reach a disconnected island", () => {
    const start = makeNode({ id: "0", kind: "classStart" });
    const node1 = makeNode({ id: "1" });
    const islandNode1 = makeNode({ id: "5" });
    const islandNode2 = makeNode({ id: "6" });
    const graph = buildGraph({
      nodes: [start, node1, islandNode1, islandNode2],
      edgePairs: [
        [start.id, node1.id],
        [islandNode1.id, islandNode2.id],
      ],
    });

    const connectedNodeIds = computeConnectivity({
      graph,
      startNodeIds: new Set([start.id]),
      whitelistedNodeIds: new Set([node1.id, islandNode1.id, islandNode2.id]),
    });
    expect(connectedNodeIds).toEqual(new Set([start.id, node1.id]));
  });
});

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
