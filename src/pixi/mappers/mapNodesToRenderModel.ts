import type { PassiveTree } from "@/domain/models/passiveTree";
import type { NodeRenderModel } from "../types/render.models";

export function mapNodes(tree: PassiveTree): NodeRenderModel[] {
  const nodes: NodeRenderModel[] = [];

  for (const [nodeId, node] of tree.nodesById) {
    const nodeRenderModel: NodeRenderModel = {
      id: nodeId,
      kind: node.kind,
      x: node.position?.x || 0,
      y: node.position?.y || 0,
      // isAllocated: allocatedNodeIds?.has(nodeId),
      // isActiveClassStart: node.kind === "classStart" && selectedClassId == node.classStartIndex,
    };

    nodes.push(nodeRenderModel);
  }

  return nodes;
}
