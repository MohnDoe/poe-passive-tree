import type { PassiveRootNode } from "@/domain/passiveGraph/PassiveNode";
import type { PassiveTreeData } from "@/domain/passiveGraph/PassiveTreeData";

export interface MappedPassiveTree extends PassiveTreeData {
  root: PassiveRootNode;
}
