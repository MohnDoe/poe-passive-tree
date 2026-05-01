import type { PassiveTreeDto } from "./dto/passiveTree/PassiveSkillTree.dto";

export async function loadPassiveTreeDto(): Promise<PassiveTreeDto> {
  const response = await fetch("/data/passiveSkillTree.json");

  if (!response.ok) {
    throw new Error("Failed to load passive tree JSON data");
  }

  return await response.json();
}
