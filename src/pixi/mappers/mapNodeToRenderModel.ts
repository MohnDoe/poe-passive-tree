import type { PassiveNode } from "@/domain/passiveGraph/PassiveNode";
import type { NodeRenderModel } from "../models/Node";

export function mapNodeToRenderModel(node: PassiveNode): NodeRenderModel {
  return {
    id: node.id,
    kind: node.kind,
    x: node.position?.x || 0,
    y: node.position?.y || 0,
  };
}
