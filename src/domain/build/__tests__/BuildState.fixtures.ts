import type { BuildState } from "../models/BuildState";

export function makeBuildState(input: Partial<BuildState>): BuildState {
  return {
    activeAscendancy: input.activeAscendancy ?? null,
    activeClassId: input.activeClassId ?? null,
    allocatedNodeIds: input.allocatedNodeIds ?? new Set(),
    ascendancyPointsBudget: input.ascendancyPointsBudget ?? 0,
    passivePointsBudget: input.passivePointsBudget ?? 128,
  };
}
