import type { PassiveTree } from "@/domain/models/passiveTree";

import type { PassiveSkillTreeDto } from "../dto/passiveSkillTree.dto";
import { mapPassiveTreeDto } from "../mapping/passiveTree.mapper";

export async function loadPassiveTree(): Promise<PassiveTree> {
  const response = await fetch("/data/passiveSkillTree.json");

  const dto: PassiveSkillTreeDto = await response.json();

  return mapPassiveTreeDto(dto);
}
