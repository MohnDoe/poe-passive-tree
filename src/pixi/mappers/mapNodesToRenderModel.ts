import type { PassiveTree } from "@/domain/models/passiveTree";
import type { NodeRenderModel } from "../types/render.models";
import type { CreateTreeSceneInput } from "../sceneModel.mapper";

export function mapNodes(
  tree: PassiveTree,
  selectedClassId: CreateTreeSceneInput["selectedClassId"],
  allocatedNodeIds: CreateTreeSceneInput["allocatedNodeIds"],
): NodeRenderModel[] {
  const nodes: NodeRenderModel[] = [];

  for (const [nodeId, node] of tree.nodesById) {
    const nodeRenderModel: NodeRenderModel = {
      id: node.id,
      kind: node.type,
      x: node.position?.x || 0,
      y: node.position?.y || 0,
      isAllocated: allocatedNodeIds.has(nodeId),
      isActiveClassStart: node.isClassStart && selectedClassId == node.classStartIndex,
      isClassStartNode: node.isClassStart,
    };

    nodes.push(nodeRenderModel);
  }

  return nodes;
}
