import type { PassiveRootNode } from "@/domain/graph/PassiveNode";
import type { PassiveTreeData } from "@/domain/graph/PassiveTreeData";

export interface MappedPassiveTree extends PassiveTreeData {
  root: PassiveRootNode;
}
