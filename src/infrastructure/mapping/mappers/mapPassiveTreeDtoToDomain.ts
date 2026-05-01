import type { PassiveTreeDto } from "../../dto/passiveTree/PassiveSkillTree.dto";
import { mapPassiveClassesDto } from "./mapPassiveClassesDto";
import { mapPassiveGroupsDto } from "./mapPassiveGroupsDto";
import { mapPassiveNodesDto } from "./mapPassiveNodesDto";
import { mapPassiveTreeRootNodeDto } from "./mapPassiveTreeRootNodeDto";
import type { MappedPassiveTree } from "../MappedPassiveTree";

export function mapPassiveTreeDtoToDomain(tree: PassiveTreeDto): MappedPassiveTree {
  return {
    nodesById: mapPassiveNodesDto(tree),
    classesById: mapPassiveClassesDto(tree),
    groupsById: mapPassiveGroupsDto(tree),
    root: mapPassiveTreeRootNodeDto(tree),
    bounds: mapBounds(tree),
  };
}

function mapBounds(tree: PassiveTreeDto): MappedPassiveTree["bounds"] {
  return {
    minX: tree.min_x,
    minY: tree.min_y,
    maxX: tree.max_x,
    maxY: tree.max_y,
  };
}
