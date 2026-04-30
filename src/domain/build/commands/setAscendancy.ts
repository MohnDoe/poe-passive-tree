import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { BuildState } from "../models/BuildState";
import type { AscendancyId } from "@/domain/passiveGraph/PassiveAscendancy";
import type { BuildCommandResult } from "./types";
import { isAscendancyValidForClass } from "@/domain/passiveGraph/queries/isAscendancyValidForClass";

export function setAscendancy(
  build: BuildState,
  graph: PassiveGraph,
  ascendancyId: AscendancyId | null,
): BuildCommandResult {
  if (build.activeClassId === null) {
    return { ok: false, reason: "NO_ACTIVE_CLASS" };
  }

  if (build.activeAscendancy === ascendancyId) {
    return { ok: false, reason: "NO_CHANGE" };
  }

  if (
    ascendancyId !== null &&
    !isAscendancyValidForClass(graph, build.activeClassId, ascendancyId)
  ) {
    return { ok: false, reason: "INVALID_ASCENDANCY_FOR_CLASS" };
  }

  const nextAllocatedNodeIds = new Set(
    [...build.allocatedNodeIds].filter(
      (nodeId) => graph.regionByNodeId.get(nodeId) !== "ascendancy",
    ),
  );

  return {
    ok: true,
    build: {
      ...build,
      activeAscendancy: ascendancyId,
      allocatedNodeIds: nextAllocatedNodeIds,
    },
  };
}
