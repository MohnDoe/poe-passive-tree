import type { PassiveGroup } from "@/domain/passiveGraph/PassiveGroup";
import type { PassiveTreeGroupDto } from "../../dto/passiveTree/Groups.dto";

export function mapPassiveGroupDto(groupId: string, raw: PassiveTreeGroupDto): PassiveGroup {
  return {
    id: groupId,
    x: raw.x,
    y: raw.y,
    nodeIds: raw.nodes,
  };
}
