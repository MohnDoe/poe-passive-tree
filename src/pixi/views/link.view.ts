import { Graphics } from "pixi.js";
import type { LinkRenderModel } from "../types/render.models";

export function createLinkView(link: LinkRenderModel): Graphics {
  const graphics = new Graphics();

  if (link.kind === "line") {
    graphics.moveTo(link.from.x, link.from.y);
    graphics.lineTo(link.to.x, link.to.y);
  } else {
    graphics.arc(link.center.x, link.center.y, link.radius, link.startAngle, link.endAngle);
  }

  graphics.stroke({
    color: 0x6c757d,
    width: 2,
    alpha: 0.75,
  });

  return graphics;
}
