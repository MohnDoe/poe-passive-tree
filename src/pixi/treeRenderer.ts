import type { PassiveTree } from "@/domain/models/passiveTree";
import { Circle, Graphics } from "pixi.js";
import type { PixiStageController } from "./stage";
import type { PassiveNode } from "@/domain/models/passiveNode";


type NodeVisualStyle = {
  radius: number
  fill: number
}

export function renderTree(stage: PixiStageController, tree: PassiveTree) {
  clearStage(stage);

  renderLinks(stage, tree.nodes);
  renderNodes(stage, tree.nodes);
}

function clearStage(stage: PixiStageController) {
  stage.nodeLayer.removeChildren();
  stage.linkLayer.removeChildren();
}

function renderLinks(stage: PixiStageController, nodes: PassiveTree['nodes']) {
  const links = new Graphics();
  for (const [nodeId, node] of nodes) {
    for (const targetId of node.outgoing) {
      // if (node.id >= targetId) continue;
      if (!node.position) continue;

      const target = nodes.get(targetId);
      if (!target) continue;
      if (!target.position) continue;

      links
        .moveTo(node.position.x, node.position.y)
        .lineTo(target.position.x, target.position.y)
    }
  }

  links.stroke({
    color: 0x5f6775,
    width: 2,
    alpha: 0.7
  })

  stage.linkLayer.addChild(links);
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
      radius: 20,
      fill: 0xc9a44b
    }
  }

  if (node.type === 'notable') {
    return {
      radius: 15,
      fill: 0x7f8bb3
    }
  }

  return {
    radius: 10,
    fill: 0x94a3b8
  }
}
