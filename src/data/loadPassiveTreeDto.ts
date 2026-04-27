import type { PassiveTreeDto } from "./dto/passiveTree/PassiveSkillTree.dto";

export async function loadPassiveTreeDto(): Promise<PassiveTreeDto> {
  const response = await fetch("/data/passiveSkillTree.json");

  return await response.json();
}
