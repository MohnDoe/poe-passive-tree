import { makeForkGraph, makeLineGraph } from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import { describe, expect, it } from "vitest";
import { computeConnectivity } from "../dependencies.ts";
import type { NodeId } from "@/domain/graph/PassiveNode.ts";

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
});
