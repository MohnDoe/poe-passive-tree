import { Build } from "../Build";
import type { BuildCommandContext, BuildCommandResult } from "./types";

export function planToggleAllocation(ctx: BuildCommandContext, nodeId: Parameters<typeof Build.toggle>[2]): BuildCommandResult {
  const result = Build.toggle(ctx.graph, ctx.build, nodeId);

  if (result.isErr()) {
    return { ok: false, reason: result.error };
  }

  return { ok: true, build: result.value };
}
