import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeRenderModel } from "../models/Node";
import { mapNodeToRenderModel } from "./mapNodeToRenderModel";

export function mapNodesToRenderModel(graph: PassiveGraph): NodeRenderModel[] {
  const nodes: NodeRenderModel[] = [];

  for (const [, node] of graph.nodesById) {
    const nodeRenderModel = mapNodeToRenderModel(node);
    nodes.push(nodeRenderModel);
  }

  return nodes;
}
