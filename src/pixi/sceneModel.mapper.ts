import type { ClassId } from "@/domain/models/passiveClass";
import type { NodeId } from "@/domain/models/passiveNode";
import type { PassiveTree } from "@/domain/models/passiveTree";
import type {
  GroupBackgroundRenderModel,
  NodeRenderModel,
  TreeSceneRenderModel,
} from "./types/render.models";
import type { Point } from "pixi.js";
import { getStartNodeIdsForClass } from "@/domain/logic/selection";
import { mapLinks } from "./mappers/mapLinksToRenderModel";

interface CreateTreeSceneInput {
  tree: PassiveTree;
  selectedClassId: ClassId | null;
  allocatedNodeIds: ReadonlySet<NodeId>;
  hoveredNodeId: NodeId | null;
  highlightedPathNodeIds: readonly NodeId[];
}

export function createTreeSceneRenderModel(input: CreateTreeSceneInput): TreeSceneRenderModel {
  const nodes = mapNodes(input.tree, input.selectedClassId, input.allocatedNodeIds);
  const backgrounds: GroupBackgroundRenderModel[] = [];
  const highlightedPath: Point[] = [];
  const links = mapLinks(input.tree);

  return {
    nodes,
    backgrounds,
    highlightedPath,
    links,
  };
}

function mapNodes(
  tree: PassiveTree,
  selectedClassId: CreateTreeSceneInput["selectedClassId"],
  allocatedNodeIds: CreateTreeSceneInput["allocatedNodeIds"],
): NodeRenderModel[] {
  const nodes: NodeRenderModel[] = [];
  const classStartNodeIds = selectedClassId
    ? getStartNodeIdsForClass(tree.nodesById, selectedClassId)
    : new Set();

  for (const [nodeId, node] of tree.nodesById) {
    const nodeRenderModel: NodeRenderModel = {
      id: node.id,
      kind: node.type,
      x: node.position?.x || 0,
      y: node.position?.y || 0,
      isAllocated: allocatedNodeIds.has(nodeId),
      isStart: classStartNodeIds.has(nodeId),
    };

    nodes.push(nodeRenderModel);
  }

  return nodes;
}
