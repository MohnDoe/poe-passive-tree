import type { PassiveTree } from "@/domain/models/passiveTree";
import { mapLinks } from "./mappers/mapLinksToRenderModel";
import { mapNodes } from "./mappers/mapNodesToRenderModel";
import type { GroupBackgroundRenderModel, TreeSceneRenderModel } from "./types/render.models";

export interface CreateTreeSceneInput {
  tree: PassiveTree;
}

export function createTreeSceneRenderModel(input: CreateTreeSceneInput): TreeSceneRenderModel {
  const nodes = mapNodes(input.tree);
  const backgrounds: GroupBackgroundRenderModel[] = [];
  const links = mapLinks(input.tree);

  return {
    nodes,
    backgrounds,
    links,
  };
}
