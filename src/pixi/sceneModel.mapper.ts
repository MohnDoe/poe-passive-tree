import type { ClassId } from "@/domain/models/passiveClass";
import type { NodeId } from "@/domain/models/passiveNode";
import type { PassiveTree } from "@/domain/models/passiveTree";
import type { Point } from "pixi.js";
import { mapLinks } from "./mappers/mapLinksToRenderModel";
import { mapNodes } from "./mappers/mapNodesToRenderModel";
import type { GroupBackgroundRenderModel, TreeSceneRenderModel } from "./types/render.models";

export interface CreateTreeSceneInput {
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
