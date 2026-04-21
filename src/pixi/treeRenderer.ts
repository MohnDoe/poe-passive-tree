import type { PassiveTree, PassiveTreeAdjacency, PassiveTreeNodesById } from "@/domain/models/passiveTree";
import { Circle, Graphics } from "pixi.js";
import type { PixiStageController } from "./stage";
import type { NodeId, PassiveNode, PassiveNodeRegion } from "@/domain/models/passiveNode";


type NodeVisualStyle = {
  radius: number
  fill: number
  stroke?: {
    width: number
    color: number
  }
}

export function renderTree(stage: PixiStageController, tree: PassiveTree) {
  clearStage(stage);

  renderLinks(stage, tree.nodesById, tree.adjacency.main);
  renderNodes(stage, tree.nodesById, { region: 'main' });
}

function clearStage(stage: PixiStageController) {
  stage.nodeLayer.removeChildren();
  stage.linkLayer.removeChildren();
}

function renderLinks(stage: PixiStageController, nodes: PassiveTreeNodesById, adj: PassiveTreeAdjacency) {
  const links = new Graphics();

  for (const [nodeAId, nodeBId] of uniqueEdgesFromAdjacency(adj)) {
    const nodeA = nodes.get(nodeAId);
    const nodeB = nodes.get(nodeBId);

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

function renderNodes(stage: PixiStageController, nodes: PassiveTreeNodesById, filter: { region: PassiveNodeRegion }) {
  for (const [nodeId, node] of nodes) {
    if (!node.position) continue;

    if (node.region !== filter.region) continue;
    const circle = new Graphics();
    const style = getNodeVisualeStyle(node)

    circle.position.set(node.position.x, node.position.y);

    circle.circle(0, 0, style.radius).fill(style.fill).stroke(style.stroke ?? undefined)


    stage.nodeLayer.addChild(circle)
  }
}

function getNodeVisualeStyle(node: PassiveNode): NodeVisualStyle {
  let style: NodeVisualStyle = {
    radius: 40,
    fill: 0x94a3b8
  }

  if (node.type === 'keystone') {
    style = {
      radius: 80,
      fill: 0xc9a44b
    }
  }

  if (node.type === 'notable') {
    style = {
      radius: 55,
      fill: 0x0f8bb3
    }
  }

  if (node.region == 'ascendancy') {
    style = {
      ...style,
      stroke: {
        width: 5,
        color: 0x00ff00
      }
    }
  }

  return style
}
