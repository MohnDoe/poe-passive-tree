import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import { mapEdgesToRenderModel } from "../mappers/mapEdgesToRenderModel";
import { mapNodesToRenderModel } from "../mappers/mapNodesToRenderModel";
import type { GroupBackgroundRenderModel, TreeSceneRenderModel } from "../models/Render";

export interface CreateTreeSceneInput {
  graph: PassiveGraph;
}

export function createTreeSceneModel(input: CreateTreeSceneInput): TreeSceneRenderModel {
  const nodes = mapNodesToRenderModel(input.graph);
  const backgrounds: GroupBackgroundRenderModel[] = [];
  const edges = mapEdgesToRenderModel(input.graph);

  return {
    nodes,
    backgrounds,
    edges,
  };
}
