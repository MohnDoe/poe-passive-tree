import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { EdgeRenderModel } from "../models/Edge";
import { mapEdgeToRenderModel } from "./mapEdgeToRenderModel";
import type { GraphEdge } from "@/domain/passiveGraph/GraphEdge";

export function mapEdgesToRenderModel(graph: PassiveGraph): EdgeRenderModel[] {
  const links: EdgeRenderModel[] = [];

  for (const edge of getRenderableEdges(graph.edges)) {
    const edgeRenderModel = mapEdgeToRenderModel(graph, edge);

    if (edgeRenderModel) links.push(edgeRenderModel);
  }

  return links;
}

function getRenderableEdges(edges: PassiveGraph["edges"]): GraphEdge[] {
  return edges.filter((edge) => {
    // RULE: Proxies are invisible structural anchors (used for jewel socket radii usually). Do not draw lines to them.
    if (edge.isProxyTransition) return false;

    // RULE: Mastery nodes sit in the center of an orbit but do not have visual lines connecting them to the notables.
    if (edge.isMasteryLink) return false;

    // RULE: Ascendancy start nodes act as teleport points from the main tree. Don't draw a massive line across the screen.
    if (edge.isAscendancyTransition) return false;

    return true;
  });
}
