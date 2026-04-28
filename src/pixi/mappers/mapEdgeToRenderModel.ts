import type { EdgeRenderModel } from "../models/Edge";
import { normalizeSignedAngle } from "@/utils/math.utils";
import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { PassiveNode } from "@/domain/passiveGraph/PassiveNode";
import { Point } from "pixi.js";
import type { GraphEdge } from "@/domain/passiveGraph/GraphEdge";
import { makeEdgeKey } from "@/services/passiveTree/runtime/graph/buildEdges";

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
