import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import type { BuildState } from "../models/BuildState";

export interface BuildCommandContext {
  graph: PassiveGraph;
  build: BuildState;
}

export type BuildCommandResult =
  | { ok: true; build: BuildState }
  | { ok: false; reason: BuildFailureReason };

export type BuildFailureReason =
  | "NO_ACTIVE_CLASS"
  | "NODE_NOT_REFUNDABLE"
  | "NODE_NOT_FOUND"
  | "NODE_NOT_ALLOCATABLE"
  | "NODE_NOT_ALLOCATED"
  | "INVALID_ASCENDANCY_FOR_CLASS"
  | "NO_CHANGE";
