import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { BuildState } from "../models/BuildState";
import type { BuildCommandContext } from "./types";
import { computeAllocationState } from "@/services/passiveTree/allocation/computeAllocationState";

export function createBuildCommandContext(
  graph: PassiveGraph,
  build: BuildState,
): BuildCommandContext {
  return {
    graph,
    build,
    snapshot: computeAllocationState({
      graph,
      buildState: build,
    }),
  };
}
