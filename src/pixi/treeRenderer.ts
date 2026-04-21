import type { PassiveTree } from "@/domain/models/passiveTree";
import { Circle, Graphics } from "pixi.js";
import type { PixiStageController } from "./stage";
import type { NodeId, PassiveNode } from "@/domain/models/passiveNode";


type NodeVisualStyle = {
  radius: number
  fill: number
}

export function renderTree(stage: PixiStageController, tree: PassiveTree) {
  clearStage(stage);

  renderLinks(stage, tree);
  renderNodes(stage, tree.nodes);
}

function clearStage(stage: PixiStageController) {
  stage.nodeLayer.removeChildren();
  stage.linkLayer.removeChildren();
}

function renderLinks(stage: PixiStageController, tree: PassiveTree) {
  const links = new Graphics();

  for (const [nodeAId, nodeBId] of uniqueEdgesFromAdjacency(tree.adjacency)) {
    const nodeA = tree.nodes.get(nodeAId);
    const nodeB = tree.nodes.get(nodeBId);

    if (!nodeA || !nodeB) continue;
    if (!nodeA.position || !nodeB.position) continue;

    links
      .moveTo(nodeA.position.x, nodeA.position.y)
      .lineTo(nodeB.position.x, nodeB.position.y)
  }

  links.stroke({
    color: 0x5f6775,
    width: 2,
    alpha: 0.7
  })

  stage.linkLayer.addChild(links);
}

type Edge = readonly [NodeId, NodeId];

function uniqueEdgesFromAdjacency(adj: PassiveTree['adjacency']): Edge[] {
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

function renderNodes(stage: PixiStageController, nodes: PassiveTree['nodes']) {
  for (const [nodeId, node] of nodes) {
    if (!node.position) continue;
    const circle = new Graphics();
    const style = getNodeVisualeStyle(node)

    circle.position.set(node.position.x, node.position.y);

    circle.circle(0, 0, style.radius).fill(style.fill)

    stage.nodeLayer.addChild(circle)
  }
}

function getNodeVisualeStyle(node: PassiveNode): NodeVisualStyle {
  if (node.type === 'keystone') {
    return {
      radius: 80,
      fill: 0xc9a44b
    }
  }

  if (node.type === 'notable') {
    return {
      radius: 55,
      fill: 0x0f8bb3
    }
  }

  return {
    radius: 40,
    fill: 0x94a3b8
  }
}
