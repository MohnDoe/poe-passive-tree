import type { PassiveNode, PassiveNodeRegion } from "@/domain/models/passiveNode";
import type { PassiveTree, PassiveTreeNodesById } from "@/domain/models/passiveTree";
import { Graphics } from "pixi.js";
import type { PixiStageController } from "./stage";
import { renderLinks } from "./tree/links.renderer";


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

  renderLinks(stage, tree, tree.adjacency.main);
  renderNodes(stage, tree.nodesById, { region: 'main' });
}

function clearStage(stage: PixiStageController) {
  stage.nodeLayer.removeChildren();
  stage.linkLayer.removeChildren();
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


