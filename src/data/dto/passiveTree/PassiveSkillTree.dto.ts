import type { PassiveTreeAssetsDto, PassiveTreeExtraImageDto } from "./Assets.dto";
import type { PassiveTreeClassDto } from "./Classes.dto";
import type { PassiveTreeConstantsDto } from "./Constants.dto";
import type { PassiveTreeGroupDto } from "./Groups.dto";
import type { PassiveTreeNodeEntryDto } from "./Nodes.dto";
import type { PassiveTreeSkillSpritesDto } from "./SkillSprites.dto";

export interface PassiveTreeDto {
  classes: PassiveTreeClassDto[];

  groups: Record<string, PassiveTreeGroupDto>;

  nodes: Record<string, PassiveTreeNodeEntryDto>;

  /** Extra background images per class. */
  extraImages: Record<string, PassiveTreeExtraImageDto>;

  /** Node ids which are jewel sockets in the main tree. */
  jewelSlots: number[];

  /** Bounds of the regular skill tree (excluding ascendancies). */
  min_x: number;
  min_y: number;
  max_x: number;
  max_y: number;

  /** Asset paths per zoom level (frame borders, etc.). */
  assets: PassiveTreeAssetsDto;

  constants: PassiveTreeConstantsDto;

  skillSprites: PassiveTreeSkillSpritesDto;

  imageZoomLevels: number[];
}
