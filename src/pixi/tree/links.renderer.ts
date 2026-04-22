import type { NodeId, PassiveNode } from "@/domain/models/passiveNode";
import type { PassiveTreeNodesById, PassiveTreeAdjacency, PassiveTree } from "@/domain/models/passiveTree";
import { Graphics } from "pixi.js";
import type { PixiStageController } from "../stage";

type Edge = readonly [NodeId, NodeId];
export function renderLinks(stage: PixiStageController, tree: PassiveTree, adj: PassiveTreeAdjacency) {
  const links = new Graphics();
  const nodes = tree.nodesById;

  for (const [nodeAId, nodeBId] of uniqueEdgesFromAdjacency(adj)) {
    const nodeA = nodes.get(nodeAId);
    const nodeB = nodes.get(nodeBId);

    if (!nodeA || !nodeB) continue;
    if (!nodeA.position || !nodeB.position) continue;

    if (shouldRenderAsArc(nodeA, nodeB)) {
      const startPoint = nodeA.position;
      const endPoint = nodeB.position;
      const groupId = nodeA.groupId!;

      const groupCenter = tree.groups.get(groupId)!;
      const radius = Math.hypot(startPoint.x - groupCenter.x, startPoint.y - groupCenter.y);
      const startAngle = Math.atan2(startPoint.y - groupCenter.y, startPoint.x - groupCenter.x);
      const endAngle = Math.atan2(endPoint.y - groupCenter.y, endPoint.x - groupCenter.x);

      // links.arcTo(startPoint.x, startPoint.y, endPoint.x, endPoint.y, radius)
      links
        .moveTo(nodeA.position.x, nodeA.position.y)
        .lineTo(nodeB.position.x, nodeB.position.y)

    } else {
      links
        .moveTo(nodeA.position.x, nodeA.position.y)
        .lineTo(nodeB.position.x, nodeB.position.y)
    }

  }

  links.stroke({
    color: 0x5f6775,
    width: 10,
    alpha: 0.7
  })

  stage.linkLayer.addChild(links);
}


function uniqueEdgesFromAdjacency(adj: PassiveTreeAdjacency): Edge[] {
  const edges: Edge[] = [];

  for (const [nodeAId, neighbors] of adj) {
    for (const nodeBId of neighbors) {
      if (nodeAId < nodeBId) {
        edges.push([nodeAId, nodeBId])
      }
    }
  }

  return edges;
}

function shouldRenderAsArc(a: PassiveNode, b: PassiveNode) {
  return a.groupId === b.groupId && a.orbit === b.orbit
}
