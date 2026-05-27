import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import type { BuildState } from "../models/BuildState";
import type { AscendancyId } from "@/domain/graph/PassiveAscendancy";
import type { BuildCommandResult } from "./types";
import { Build } from "../Build";

export function setAscendancy(
  build: BuildState,
  graph: PassiveGraph,
  ascendancyId: AscendancyId | null,
): BuildCommandResult {
  const result = Build.setAscendancy(graph, build, ascendancyId);
  if (result.isErr()) {
    return { ok: false, reason: result.error };
  }
  return { ok: true, build: result.value };
}
