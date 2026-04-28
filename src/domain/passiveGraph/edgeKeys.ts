import type { EdgeKey } from "./GraphEdge";
import type { NodeId } from "./PassiveNode";

export function makeEdgeKey(sourceId: NodeId, targetId: NodeId) {
  const min = Math.min(parseInt(sourceId), parseInt(targetId));
  const max = Math.max(parseInt(sourceId), parseInt(targetId));
  return `${min}-${max}`;
}

export function makeEdgeKeysFromPath(path: NodeId[]): Set<EdgeKey> {
  const edgeKeys = new Set<EdgeKey>();
  for (let i = 1; i < path.length; i += 1) {
    edgeKeys.add(makeEdgeKey(path[i - 1]!, path[i]!));
  }

  return edgeKeys;
}
