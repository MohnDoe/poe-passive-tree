import type { NodeId, PassiveNode } from "@/domain/graph/PassiveNode";
import type { PassiveTreeDto } from "../../dto/passiveTree/PassiveSkillTree.dto";
import type { MappedPassiveTree } from "../MappedPassiveTree";
import { isPassiveNode } from "../../dto/passiveTree/Nodes.dto";
import { mapPassiveNodeDto } from "./mapPassiveNodeDto";

export function mapPassiveNodesDto(tree: PassiveTreeDto): MappedPassiveTree["nodesById"] {
  const out = new Map<NodeId, PassiveNode>();

  for (const nodeId in tree.nodes) {
    const raw = tree.nodes[nodeId]!;

    if (!isPassiveNode(raw)) continue;

    out.set(nodeId, mapPassiveNodeDto(nodeId, raw, tree));
  }

  return out;
}
