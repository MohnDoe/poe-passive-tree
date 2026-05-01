import type { GraphEdge } from "@/domain/graph/GraphEdge";
import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import type { PassiveNode } from "@/domain/graph/PassiveNode";
import { makeEdgeKey } from "@/domain/graph/edgeKeys";
import { normalizeSignedAngle } from "@/shared/utils/math.utils";
import { Point } from "pixi.js";
import type { EdgeRenderModel } from "../models/Edge";

export function mapEdgeToRenderModel(
  graph: PassiveGraph,
  edge: GraphEdge,
): EdgeRenderModel | undefined {
  const aId = edge.source;
  const bId = edge.target;
  const nodeA = graph.nodesById.get(aId);
  const nodeB = graph.nodesById.get(bId);

  if (!nodeA || !nodeB) return;
  if (!nodeA.position || !nodeB.position) return;

  const key = makeEdgeKey(aId, bId);
  const startPoint = nodeA.position;
  const endPoint = nodeB.position;
  if (shouldBeAnArc(nodeA, nodeB)) {
    const groupId = nodeA.groupId!;

    const groupCenter = graph.groupsById.get(groupId)!;
    const radius = Math.hypot(startPoint.x - groupCenter.x, startPoint.y - groupCenter.y);
    const startAngle = Math.atan2(startPoint.y - groupCenter.y, startPoint.x - groupCenter.x);
    const rawEndAngle = Math.atan2(endPoint.y - groupCenter.y, endPoint.x - groupCenter.x);

    const shortestDelta = normalizeSignedAngle(rawEndAngle - startAngle);
    const endAngle = startAngle + shortestDelta;

    return {
      kind: "arc",
      radius,
      center: new Point(groupCenter.x, groupCenter.y),
      endAngle,
      startAngle,
      key,
      anticlockwise: shortestDelta < 0,
    };
  } else {
    return {
      key,
      kind: "line",
      from: new Point(startPoint.x, startPoint.y),
      to: new Point(endPoint.x, endPoint.y),
    };
  }
}

function shouldBeAnArc(a: PassiveNode, b: PassiveNode) {
  return a.groupId === b.groupId && a.orbit === b.orbit;
}
