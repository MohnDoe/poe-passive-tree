import type { PassiveRootNode } from "@/domain/graph/PassiveNode";
import { ROOT_NODE_ID } from "../../dto/passiveTree/Nodes.dto";
import type { PassiveTreeDto } from "../../dto/passiveTree/PassiveSkillTree.dto";

export function mapPassiveTreeRootNodeDto(tree: PassiveTreeDto): PassiveRootNode {
  const rootNodeIn = tree.nodes[ROOT_NODE_ID] ?? undefined;

  if (!rootNodeIn) {
    console.error("No root node");
    throw new Error("No root node!");
  }

  return {
    groupId: rootNodeIn.group?.toString() ?? "0",
    in: rootNodeIn.in ?? [],
    out: rootNodeIn.out ?? [],
    orbit: rootNodeIn.orbit ?? 0,
    orbitIndex: rootNodeIn.orbitIndex ?? 0,
  };
}
