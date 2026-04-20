import type { PassiveTreeAssetsDto, PassiveTreeExtraImageDto } from "./assets.dto";
import type { PassiveTreeClassDto } from "./classes.dto";
import type { PassiveTreeConstantsDto } from "./constants.dto";
import type { PassiveTreeGroupDto } from "./groups.dto";
import type { PassiveTreeNodeEntryDto } from "./nodes.dto";
import type { PassiveTreeSkillSpritesDto } from "./skillSprites.dto";



export interface PassiveSkillTreeDto {
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
