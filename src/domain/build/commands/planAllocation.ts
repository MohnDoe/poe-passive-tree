import { Build } from "../Build";
import type { BuildCommandContext, BuildCommandResult } from "./types";

export function planAllocation(
  { graph, build }: BuildCommandContext,
  nodeId: Parameters<typeof Build.allocate>[2],
): BuildCommandResult {
  const result = Build.allocate(graph, build, nodeId);

  if (result.isErr()) {
    return { ok: false, reason: result.error };
  }

  return { ok: true, build: result.value };
}
