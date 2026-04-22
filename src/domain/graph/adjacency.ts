import type { NormalizedNodes } from "@/data/mapping/nodes.mapper";
import type { NodeId } from "../models/passiveNode";
import type {
  PassiveTree,
  PassiveTreeAdjacency,
  PassiveTreeNodesById,
} from "../models/passiveTree";

export function buildMainAdjacency(nodes: PassiveTreeNodesById): PassiveTreeAdjacency {
  //
  const mainNodes = new Map([...nodes.entries()].filter(([_, node]) => node.region == "main"));

  return buildAdjacency(mainNodes);
}

export function buildAscendancyAdjacency(nodes: PassiveTree["nodesById"]): PassiveTreeAdjacency {
  //
  const ascendancyNodes = new Map(
    [...nodes.entries()].filter(([_, node]) => node.region == "ascendancy"),
  );

  return buildAdjacency(ascendancyNodes);
}

export function buildFullAdjacency(nodes: NormalizedNodes): PassiveTreeAdjacency {
  return buildAdjacency(nodes);
}

export function buildAdjacency(nodes: NormalizedNodes): PassiveTreeAdjacency {
  const adj: Map<NodeId, Set<NodeId>> = new Map();

  const connect = (a: NodeId, b: NodeId) => {
    let listA = adj.get(a);
    if (!listA) {
      listA = new Set();
      adj.set(a, listA);
    }

    listA.add(b);
  };
  for (const [nodeId, node] of nodes) {
    if (!adj.has(nodeId)) {
      adj.set(nodeId, new Set());
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
