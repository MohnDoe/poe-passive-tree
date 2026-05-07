import type { PassiveNode } from "@/domain/graph/PassiveNode";
import type { NodeRenderModel } from "../models/Node";

export function mapNodeToRenderModel(node: PassiveNode): NodeRenderModel {
  return {
    id: node.id,
    kind: node.kind,
    icon: node.icon,
    x: node.position?.x || 0,
    y: node.position?.y || 0,
  };
}
