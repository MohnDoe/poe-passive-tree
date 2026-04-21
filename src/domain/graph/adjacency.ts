import type { NormalizedNodes } from "@/data/mapping/nodes";
import type { NodeId } from "../models/passiveNode";
import type { PassiveTree, PassiveTreeAdjacency, PassiveTreeNodesById } from "../models/passiveTree";

export function buildMainAdjacency(nodes: PassiveTreeNodesById): PassiveTreeAdjacency {
  //
  const mainNodes = new Map(
    [...nodes.entries()]
      .filter(([_, node]) => node.region == 'main'))

  return buildAdjacency(mainNodes);
}

export function buildAscendancyAdjacency(nodes: PassiveTree['nodesById']): PassiveTreeAdjacency {
  //
  const ascendancyNodes = new Map(
    [...nodes.entries()]
      .filter(([_, node]) => node.region == 'ascendancy'))

  return buildAdjacency(ascendancyNodes);
}

export function buildFullAdjacency(nodes: NormalizedNodes): PassiveTreeAdjacency {
  return buildAdjacency(nodes)
}

export function buildAdjacency(nodes: NormalizedNodes): PassiveTreeAdjacency {
  const adj: Map<NodeId, NodeId[]> = new Map();

  const connect = (a: NodeId, b: NodeId) => {
    let listA = adj.get(a);
    if (!listA) {
      listA = [];
      adj.set(a, listA)
    }

    if (!listA.includes(b)) {
      listA.push(b);
    }
  }
  for (const [nodeId, node] of nodes) {
    if (!adj.has(nodeId)) {
      adj.set(nodeId, []);
    }

    const ins = node.in ?? [];
    const outs = node.out ?? [];

    for (const target of outs) {
      if (!nodes.has(target)) continue;
      connect(nodeId, target);
      connect(target, nodeId);
    }

    for (const source of ins) {
      if (!nodes.has(source)) continue;
      connect(nodeId, source);
      connect(source, nodeId);
    }
  }

  return adj;
}
