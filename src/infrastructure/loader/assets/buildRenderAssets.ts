import type { PassiveTreeRenderAssets } from "@/domain/graph/PassiveTreeRenderAssets";
import type { PassiveTreeDto } from "@/infrastructure/passiveTree/dto/passiveTree/PassiveSkillTree.dto";
import { mapRenderAssetsFromJson } from "@/infrastructure/passiveTree/mapping/mappers/mapRenderAssetsFromJson";

export function buildRenderAssets(raw: PassiveTreeDto): PassiveTreeRenderAssets {
  return mapRenderAssetsFromJson(raw);
}
