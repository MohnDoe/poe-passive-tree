import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import { mapEdgesToRenderModel } from "../mappers/mapEdgesToRenderModel";
import { mapNodesToRenderModel } from "../mappers/mapNodesToRenderModel";
import type { TreeSceneRenderModel } from "../models/Render";
import { mapGroupBackgroundsToRenderModel } from "../mappers/mapGroupBackgroundsToRenderModel";

export interface CreateTreeSceneInput {
  graph: PassiveGraph;
}

export function createTreeSceneModel(input: CreateTreeSceneInput): TreeSceneRenderModel {
  const nodes = mapNodesToRenderModel(input.graph);
  const groupBackgrounds = mapGroupBackgroundsToRenderModel(input.graph);
  const edges = mapEdgesToRenderModel(input.graph);

  return {
    nodes,
    groupBackgrounds,
    edges,
  };
}
