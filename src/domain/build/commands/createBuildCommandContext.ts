import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { BuildState } from "../models/BuildState";
import type { BuildCommandContext } from "./types";

export function createBuildCommandContext(
  graph: PassiveGraph,
  build: BuildState,
): BuildCommandContext {
  return {
    graph,
    build,
  };
}
