import type { PassiveClass } from "@/domain/graph/PassiveClass";
import type { PassiveTreeClassDto } from "../../dto/passiveTree/Classes.dto";

export function mapPassiveClassDto(classId: number, raw: PassiveTreeClassDto): PassiveClass {
  return {
    id: classId,
    name: raw.name,
    ascendancyIds: raw.ascendancies.map((a) => a.id),
  };
}
