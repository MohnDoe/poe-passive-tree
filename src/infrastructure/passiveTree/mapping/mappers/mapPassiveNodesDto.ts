import type { NodeId, PassiveNode } from "@/domain/graph/PassiveNode";
import type { PassiveTreeNodeDto, PassiveTreeNodeEntryDto } from "../../dto/passiveTree/Nodes.dto";
import type { PassiveTreeDto } from "../../dto/passiveTree/PassiveSkillTree.dto";
import type { MappedPassiveTree } from "../MappedPassiveTree";
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

function isPassiveNode(node: PassiveTreeNodeEntryDto | undefined): node is PassiveTreeNodeDto {
  return !!node && typeof (node as PassiveTreeNodeDto).skill === "number";
}
