import type { AscendancyId } from "./PassiveAscendancy";

export type ClassId = number;

export interface PassiveClass {
  id: ClassId;
  name: string;
  ascendancyIds: AscendancyId[];
}
