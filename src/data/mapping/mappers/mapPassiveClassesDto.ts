import type { ClassId, PassiveClass } from "@/domain/passiveGraph/PassiveClass";
import type { PassiveTreeDto } from "../../dto/passiveTree/PassiveSkillTree.dto";
import type { MappedPassiveTree } from "../MappedPassiveTree";
import { mapPassiveClassDto } from "./mapPassiveClassDto";

export function mapPassiveClassesDto(tree: PassiveTreeDto): MappedPassiveTree["classesById"] {
  const out: Map<ClassId, PassiveClass> = new Map();

  for (const classId in tree.classes) {
    const raw = tree.classes[classId]!;

    out.set(parseInt(classId), mapPassiveClassDto(parseInt(classId), raw));
  }

  return out;
}
