import type { PassiveNodeKind } from "@/domain/graph/PassiveNode";
import type { NodeBuildState, NodeHoverState } from "../models/Node";
import type { SpriteCategoryName } from "@/domain/graph/PassiveTreeRenderAssets";

function isActive(build: NodeBuildState, hover: NodeHoverState): boolean {
  return build.isAllocated || build.isActiveClassStart || hover.isInPreviewPath || hover.isHovered;
}

export function resolveSpriteCategoryName(
  kind: PassiveNodeKind,
  build: NodeBuildState,
  hover: NodeHoverState,
): SpriteCategoryName {
  const active = isActive(build, hover);

  switch (kind) {
    case "keystone":
    case "notable":
    case "normal":
      return (kind + (active ? "Active" : "Inactive")) as SpriteCategoryName;
    case "mastery":
      //TODO: handle all
      //   "masteryConnected"
      // | "masteryActiveSelected"
      // | "masteryInactive"
      // | "masteryActiveEffect"

      return active ? "masteryConnected" : "masteryInactive";
    case "jewel":
      return "jewel";
    default:
      return active ? "normalActive" : "normalInactive";
  }
}
