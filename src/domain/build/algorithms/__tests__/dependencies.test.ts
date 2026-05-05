import {
  buildGraph,
  makeDiamondGraph,
  makeForkGraph,
  makeLineGraph,
  makeNode,
} from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import type { NodeId } from "@/domain/graph/PassiveNode.ts";
import { describe, expect, it } from "vitest";
import { computeConnectivity } from "../dependencies.ts";

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

  it("reach all branches of forked graph", () => {
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

  it("spreads from root nodes", () => {
    const { graph, nodes } = makeLineGraph();
    const connectedNodeIds = computeConnectivity({
      graph,
      rootNodeIds: new Set([nodes.start.id, nodes.sixth.id]),
      whitelistedNodeIds: new Set([nodes.first.id, nodes.fifth.id]),
    });

    expect(connectedNodeIds.size).toBe(4);
    expect(connectedNodeIds.has(nodes.second.id)).toBe(false);

    const expectedNodeIds = [nodes.first.id, nodes.fifth.id, nodes.start.id, nodes.sixth.id];
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
