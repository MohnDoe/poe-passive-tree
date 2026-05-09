import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import type { GroupBackgroundRenderModel } from "../models/Render";

export function mapGroupBackgroundsToRenderModel(
  graph: PassiveGraph,
): GroupBackgroundRenderModel[] {
  const models: GroupBackgroundRenderModel[] = [];
  for (const [groupId, group] of graph.groupsById) {
    if (group.background) {
      models.push({
        image: group.background.image,
        isHalfImage: group.background.isHalfImage,
        key: `group-bg-${groupId}`,
        x: group.x,
        y: group.y,
      });
    }
  }

  return models;
}
