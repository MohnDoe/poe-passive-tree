import type { PassiveTree } from "@/domain/models/passiveTree";
import type { LinkRenderModel } from "../types/render.models";
import { uniqueEdgesFromAdjacency } from "@/domain/graph/ascendancy";
import type { PassiveNode } from "@/domain/models/passiveNode";
import { Point } from "pixi.js";
import { normalizeSignedAngle } from "@/utils/math.utils";

export function mapLinks(tree: PassiveTree): LinkRenderModel[] {
  const nodes = tree.nodesById;
  const adj = tree.adjacency.main;
  const links: LinkRenderModel[] = [];

  for (const [aId, bId] of uniqueEdgesFromAdjacency(adj)) {
    const nodeA = nodes.get(aId);
    const nodeB = nodes.get(bId);

    if (!nodeA || !nodeB) continue;
    if (!nodeA.position || !nodeB.position) continue;

    const key = aId < bId ? `${aId}-${bId}` : `${bId}-${aId}`;
    const startPoint = nodeA.position;
    const endPoint = nodeB.position;
    if (shouldBeAnArc(nodeA, nodeB)) {
      const groupId = nodeA.groupId!;

      const groupCenter = tree.groups.get(groupId)!;
      const radius = Math.hypot(startPoint.x - groupCenter.x, startPoint.y - groupCenter.y);
      const startAngle = Math.atan2(startPoint.y - groupCenter.y, startPoint.x - groupCenter.x);
      const rawEndAngle = Math.atan2(endPoint.y - groupCenter.y, endPoint.x - groupCenter.x);

      const shortestDelta = normalizeSignedAngle(rawEndAngle - startAngle);
      const endAngle = startAngle + shortestDelta;

      links.push({
        kind: "arc",
        radius,
        center: new Point(groupCenter.x, groupCenter.y),
        endAngle,
        startAngle,
        key,
      });
    } else {
      links.push({
        key,
        kind: "line",
        from: new Point(startPoint.x, startPoint.y),
        to: new Point(endPoint.x, endPoint.y),
      });
    }
  }

  return links;
}

function shouldBeAnArc(a: PassiveNode, b: PassiveNode) {
  return a.groupId === b.groupId && a.orbit === b.orbit;
}
