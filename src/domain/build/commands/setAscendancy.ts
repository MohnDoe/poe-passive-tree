// oxlint-disable no-unused-vars
import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { BuildState } from "../models/BuildState";
import type { AscendancyId } from "@/domain/passiveGraph/PassiveAscendancy";
import type { BuildCommandResult } from "./types";

export function setAscendancy(
  build: BuildState,
  graph: PassiveGraph,
  ascendancyId: AscendancyId | null,
): BuildCommandResult {
  // TODO:
  return { ok: false, reason: "INVALID_ASCENDANCY_FOR_CLASS" };
}
