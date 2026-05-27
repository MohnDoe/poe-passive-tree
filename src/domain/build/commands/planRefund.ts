import { Build } from "../Build";
import type { BuildCommandContext, BuildCommandResult } from "./types";

export function planRefund(
  { graph, build }: BuildCommandContext,
  nodeId: Parameters<typeof Build.refund>[2],
): BuildCommandResult {
  const result = Build.refund(graph, build, nodeId);

  if (result.isErr()) {
    return { ok: false, reason: result.error };
  }

  return { ok: true, build: result.value };
}
