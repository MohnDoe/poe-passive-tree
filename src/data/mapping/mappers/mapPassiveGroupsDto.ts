import type { GroupId, PassiveGroup } from "@/domain/passiveGraph/PassiveGroup";
import type { PassiveTreeDto } from "../../dto/passiveTree/PassiveSkillTree.dto";
import type { MappedPassiveTree } from "../MappedPassiveTree";
import { mapPassiveGroupDto } from "./mapPassiveGroupDto";

export function mapPassiveGroupsDto(tree: PassiveTreeDto): MappedPassiveTree["groupsById"] {
  const out: Map<GroupId, PassiveGroup> = new Map();
  for (const groupId in tree.groups) {
    const raw = tree.groups[groupId]!;

    out.set(groupId, mapPassiveGroupDto(groupId, raw));
  }

  return out;
}
