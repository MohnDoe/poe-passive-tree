import {
  buildGraph,
  makeDiamondGraph,
  makeForkGraph,
  makeLineGraph,
  makeNode,
} from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import type { NodeId } from "@/domain/graph/PassiveNode.ts";
import { describe, expect, it } from "vitest";
import { computeConnectivity, computeDependencies } from "../dependencies.ts";

describe("computeConnectivity", () => {
  it("returns all whitelisted nodes in a simple line", () => {
    const { graph, nodes } = makeLineGraph();
    const whitelistedNodeIds = new Set([nodes.start.id, nodes.first.id, nodes.second.id]);
    const connectedNodeIds = computeConnectivity({
      graph,
      rootNodeIds: new Set([nodes.start.id]),
      whitelistedNodeIds,
    });

    expect(connectedNodeIds.size).toBe(whitelistedNodeIds.size);

    const expectedNodeIds = [nodes.start.id, nodes.first.id, nodes.second.id];
    for (const expectedNodeId of expectedNodeIds) {
      expect(connectedNodeIds.has(expectedNodeId)).toBe(true);
    }
  });

  it("always includes root node(s) regardless of whitelist", () => {
    const { graph, nodes } = makeLineGraph();

    const connectedNodeIds = computeConnectivity({
      graph,
      rootNodeIds: new Set([nodes.start.id]),
      whitelistedNodeIds: new Set([nodes.first.id]),
    });

    expect(connectedNodeIds.has(nodes.start.id)).toBe(true);
  });

  it("returns root node(s) when whitelist is empty", () => {
    const { graph, nodes } = makeLineGraph();

    const connectedNodeIds = computeConnectivity({
      graph,
      rootNodeIds: new Set([nodes.start.id]),
      whitelistedNodeIds: new Set(),
    });

    expect(connectedNodeIds.size).toBe(1);
    expect(connectedNodeIds.has(nodes.start.id)).toBe(true);
  });

  it("cuts a chain of nodes if a link is not whitelisted", () => {
    const { graph, nodes } = makeLineGraph();

    const connectedNodeIds = computeConnectivity({
      graph,
      rootNodeIds: new Set([nodes.start.id]),
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
      rootNodeIds: new Set([nodes.start.id]),
      whitelistedNodeIds,
    });

    expect(connectedNodeIds.size).toBe(6);

    for (const whitelistedNodeId of whitelistedNodeIds) {
      expect(connectedNodeIds.has(whitelistedNodeId)).toBe(true);
    }
  });

  it("spreads from root nodes in a disconnected graph", () => {
    const { graph, nodes } = makeLineGraph();
    const connectedNodeIds = computeConnectivity({
      graph,
      rootNodeIds: new Set([nodes.start.id, nodes.sixth.id]),
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
    const rootNodeIds = new Set([nodes.start.id]);
    const whitelistedNodeIds = new Set([
      nodes.left.first.id,
      nodes.right.first.id,
      nodes.right.second.id,
      nodes.end.id,
    ]);

    const connectedNodeIds = computeConnectivity({
      graph,
      rootNodeIds,
      whitelistedNodeIds,
    });

    const expectedNodeIds = new Set([...rootNodeIds, ...whitelistedNodeIds]);

    expect(connectedNodeIds.size).toBe(expectedNodeIds.size);

    for (const expectedNodeId of expectedNodeIds) {
      expect(connectedNodeIds.has(expectedNodeId)).toBe(true);
    }
  });

  it("still reaches convergence node of diamond graph when one path is complete", () => {
    const { graph, nodes } = makeDiamondGraph();
    const rootNodeIds = new Set([nodes.start.id]);
    const whitelistedNodeIds = new Set([nodes.left.first.id, nodes.right.first.id, nodes.end.id]);

    const connectedNodeIds = computeConnectivity({
      graph,
      rootNodeIds,
      whitelistedNodeIds,
    });

    const expectedNodeIds = new Set([...rootNodeIds, ...whitelistedNodeIds]);

    expect(connectedNodeIds.size).toBe(expectedNodeIds.size);

    for (const expectedNodeId of expectedNodeIds) {
      expect(connectedNodeIds.has(expectedNodeId)).toBe(true);
    }
  });

  it("does not reach convergence node of diamond graph if all path are incomplete", () => {
    const { graph, nodes } = makeDiamondGraph();
    const rootNodeIds = new Set([nodes.start.id]);
    const whitelistedNodeIds = new Set([nodes.right.first.id, nodes.end.id]);

    const connectedNodeIds = computeConnectivity({
      graph,
      rootNodeIds,
      whitelistedNodeIds,
    });

    const expectedNodeIds = new Set([...rootNodeIds, nodes.right.first.id]);

    expect(connectedNodeIds.size).toBe(expectedNodeIds.size);

    for (const expectedNodeId of expectedNodeIds) {
      expect(connectedNodeIds.has(expectedNodeId)).toBe(true);
    }
  });

  it("does not reach a disconnected island", () => {
    const root = makeNode({ id: "0", kind: "classStart" });
    const node1 = makeNode({ id: "1" });
    const islandNode1 = makeNode({ id: "5" });
    const islandNode2 = makeNode({ id: "6" });
    const graph = buildGraph({
      nodes: [root, node1, islandNode1, islandNode2],
      edgePairs: [
        [root.id, node1.id],
        [islandNode1.id, islandNode2.id],
      ],
    });

    const connectedNodeIds = computeConnectivity({
      graph,
      rootNodeIds: new Set([root.id]),
      whitelistedNodeIds: new Set([node1.id, islandNode1.id, islandNode2.id]),
    });
    expect(connectedNodeIds).toEqual(new Set([root.id, node1.id]));
  });
});

describe("computeDependencies", () => {
  it("ignores root nodes", () => {
    const { graph, nodes } = makeLineGraph();

    const rootNodeIds = new Set([nodes.start.id]);
    const allocatedNodeIds = new Set([nodes.first.id, nodes.second.id, nodes.third.id]);

    const { dependsOnByNodeId, requiredByNodeId } = computeDependencies({
      graph,
      allocatedNodeIds,
      rootNodeIds,
    });

    // root is not tracked as a candidate — no entry in either map
    expect(requiredByNodeId.has(nodes.start.id)).toBe(false);

    // no allocated node lists the root as something it depends on
    for (const allocatedNodeId of allocatedNodeIds) {
      expect(dependsOnByNodeId.get(allocatedNodeId)!.has(nodes.start.id)).toBe(false);
    }
  });

  // linear graph

  it("connects allocated nodes in a line graph", () => {
    const { graph, nodes } = makeLineGraph();

    const rootNodeIds = new Set([nodes.start.id]);
    const allocatedNodeIds = new Set([nodes.first.id, nodes.second.id, nodes.third.id]);

    const { dependsOnByNodeId, requiredByNodeId } = computeDependencies({
      graph,
      allocatedNodeIds,
      rootNodeIds,
    });

    expect(dependsOnByNodeId.get(nodes.third.id)).toStrictEqual(
      new Set([nodes.first.id, nodes.second.id]),
    );
    expect(dependsOnByNodeId.get(nodes.second.id)).toStrictEqual(new Set([nodes.first.id]));
    expect(dependsOnByNodeId.get(nodes.first.id)).toStrictEqual(new Set());

    expect(requiredByNodeId.get(nodes.first.id)).toStrictEqual(
      new Set([nodes.second.id, nodes.third.id]),
    );
    expect(requiredByNodeId.get(nodes.second.id)).toStrictEqual(new Set([nodes.third.id]));
    expect(requiredByNodeId.get(nodes.third.id)).toStrictEqual(new Set());
  });

  // diamong graph

  it("diamond: neither side-path node requires the other", () => {
    const { graph, nodes } = makeDiamondGraph();

    const allocatedNodeIds = new Set([
      nodes.left.first.id,
      nodes.right.first.id,
      nodes.right.second.id,
      nodes.end.id,
    ]);
    const rootNodeIds = new Set([nodes.start.id]);

    const { requiredByNodeId } = computeDependencies({
      graph,
      allocatedNodeIds,
      rootNodeIds,
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
    const rootNodeIds = new Set([nodes.start.id]);
    const allocatedNodeIds = new Set([nodes.left.first.id, nodes.end.id]);

    const { requiredByNodeId } = computeDependencies({
      graph,
      allocatedNodeIds,
      rootNodeIds,
    });

    // Now left-1 is the only path to end — "end" IS dependent on left-1
    expect(requiredByNodeId.get(nodes.left.first.id)?.has(nodes.end.id)).toBe(true);
  });

  // fork graph

  it("fork: removing the branching node disconnects both branches", () => {
    const { graph, nodes } = makeForkGraph();
    const allocatedNodeIds = new Set<NodeId>([
      nodes.first.id,
      nodes.left.first.id,
      nodes.left.second.id,
      nodes.right.first.id,
      nodes.right.second.id,
    ]);
    const rootNodeIds = new Set([nodes.start.id]);

    const { requiredByNodeId } = computeDependencies({
      graph,
      allocatedNodeIds,
      rootNodeIds,
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
    const rootNodeIds = new Set([nodes.start.id]);

    const { requiredByNodeId } = computeDependencies({
      graph,
      allocatedNodeIds,
      rootNodeIds,
    });

    // removing left-second (a leaf) disconnects nobody else
    expect(requiredByNodeId.get(nodes.left.second.id)?.size).toBe(0);
  });

  // multi roots
  it("node reachable from two roots has no single dependency", () => {
    // Two separate roots both connected to a shared middle node
    // root-a -- middle -- leaf
    // root-b -
    const rootA = makeNode({ id: "root-a", kind: "classStart" });
    const rootB = makeNode({ id: "root-b", kind: "classStart" });
    const middle = makeNode({ id: "middle" });
    const leaf = makeNode({ id: "leaf" });

    const graph = buildGraph({
      nodes: [rootA, rootB, middle, leaf],
      edgePairs: [
        [rootA.id, middle.id],
        [rootB.id, middle.id],
        [middle.id, leaf.id],
      ],
    });

    // roots are excluded from allocatedNodeIds — computeDependencies handles them separately
    const allocatedNodeIds = new Set([middle.id, leaf.id]);
    const rootNodeIds = new Set([rootA.id, rootB.id]);

    const { dependsOnByNodeId, requiredByNodeId } = computeDependencies({
      graph,
      allocatedNodeIds,
      rootNodeIds,
    });

    // middle is reachable from both roots — it depends on nothing
    expect(dependsOnByNodeId.get(middle.id)?.size).toBe(0);

    // removing middle disconnects leaf — leaf requires middle
    expect(requiredByNodeId.get(middle.id)?.has(leaf.id)).toBe(true);

    // leaf's only path to the tree is through middle
    expect(dependsOnByNodeId.get(leaf.id)?.has(middle.id)).toBe(true);
  });
});
