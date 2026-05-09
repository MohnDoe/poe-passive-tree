import type { PassiveGroup } from "@/domain/graph/PassiveGroup";
import type { PassiveTreeGroupDto } from "../../dto/passiveTree/Groups.dto";

export function mapPassiveGroupDto(groupId: string, raw: PassiveTreeGroupDto): PassiveGroup {
  return {
    id: groupId,
    x: raw.x,
    y: raw.y,
    nodeIds: raw.nodes,
    background: raw.background
      ? {
          image: raw.background.image,
          isHalfImage: raw.background.isHalfImage ?? false,
        }
      : undefined,
  };
}
