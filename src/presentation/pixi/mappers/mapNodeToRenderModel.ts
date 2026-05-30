import type { PassiveNode } from "@/domain/graph/PassiveNode";
import type { BaseRenderModel, MasteryNodeRenderModel, NodeRenderModel } from "../models/Node";

export function mapNodeToRenderModel(node: PassiveNode): NodeRenderModel | MasteryNodeRenderModel {
  const result: BaseRenderModel = {
    id: node.id,
    kind: node.kind,
    icon: node.icon,
    x: node.position?.x || 0,
    y: node.position?.y || 0,
  };

  if (node.kind == "mastery") {
    return {
      ...result,
      activeIcon: node.activeIcon,
      inactiveIcon: node.inactiveIcon,
      activeEffectImage: node.activeEffectImage,
    } as MasteryNodeRenderModel;
  } else {
    return result as NodeRenderModel;
  }
}
