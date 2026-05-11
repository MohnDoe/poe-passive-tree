import type { EdgeRenderModel } from "../models/Edge";
import type { EdgeKey } from "@/domain/graph/GraphEdge";

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function computeEdgeBounds(
  edge: EdgeRenderModel,
  margin = 20,
): { key: EdgeKey; bounds: Bounds } {
  let bounds: Bounds;

  if (edge.kind === "line") {
    bounds = {
      minX: Math.min(edge.from.x, edge.to.x) - margin,
      minY: Math.min(edge.from.y, edge.to.y) - margin,
      maxX: Math.max(edge.from.x, edge.to.x) + margin,
      maxY: Math.max(edge.from.y, edge.to.y) + margin,
    };
  } else {
    // Arc: conservative AABB — bounding circle of the arc
    bounds = {
      minX: edge.center.x - edge.radius - margin,
      minY: edge.center.y - edge.radius - margin,
      maxX: edge.center.x + edge.radius + margin,
      maxY: edge.center.y + edge.radius + margin,
    };
  }

  return { key: edge.key, bounds };
}
