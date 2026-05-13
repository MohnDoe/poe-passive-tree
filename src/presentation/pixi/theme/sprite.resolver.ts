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
    case "mastery": {
      const isAllocated = build.isAllocated;
      const isHovered = hover.isInPreviewPath || hover.isHovered;

      if (isAllocated) {
        // Mastery effect visible when allocated
        return "masteryActiveSelected";
      } else if (isHovered) {
        // Selected state on hover/preview
        return "masteryConnected";
      } else {
        // Default unallocated state
        return "masteryInactive";
      }
    }
    case "jewel":
      return "jewel";
    default:
      return active ? "normalActive" : "normalInactive";
  }
}

export function resolveFrameCoordsKey(
  kind: PassiveNodeKind,
  build: NodeBuildState,
  hover: NodeHoverState,
): string | null {
  let key = null;

  if (kind == "keystone") {
    key = "KeystoneFrame";
  } else if (kind == "notable") {
    key = "NotableFrame";
  } else if (kind == "jewel") {
    key = "JewelFrame";
  } else if (kind == "normal") {
    key = "PSSkillFrame";
  } else {
    return null;
  }

  if (kind == "normal") {
    if (build.isAllocated) {
      key += "Active";
    } else if (hover.isInRefundPath || hover.isInPreviewPath || hover.isHovered) {
      key += "Highlighted";
    } else {
      // no suffix
      key += "";
    }
  } else {
    if (build.isAllocated) {
      key += "Allocated";
    } else {
      if (hover.isInPreviewPath || hover.isInRefundPath || hover.isHovered) {
        key += "CanAllocate";
      } else {
        key += "Unallocated";
      }
    }
  }

  return key;
}
