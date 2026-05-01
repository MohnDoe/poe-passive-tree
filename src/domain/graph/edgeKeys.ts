import type { EdgeKey } from "./GraphEdge";
import type { NodeId } from "./PassiveNode";

export function makeEdgeKey(aId: NodeId, bId: NodeId) {
  const a = Number(aId);
  const b = Number(bId);

  return a <= b ? `${aId}-${bId}` : `${bId}-${aId}`;
}

export interface MakeEdgeKeysFromPathParams {
  path: ReadonlyArray<NodeId>;
  allowedNodeIds?: ReadonlySet<NodeId>;
}

export function makeEdgeKeysFromPath({
  path,
  allowedNodeIds,
}: MakeEdgeKeysFromPathParams): Set<EdgeKey> {
  const edgeKeys = new Set<EdgeKey>();

  for (let i = 1; i < path.length; i += 1) {
    const aId = path[i - 1]!;
    const bId = path[i]!;

    if (!aId || !bId) continue;

    if (allowedNodeIds !== undefined) {
      if (!allowedNodeIds.has(aId) && !allowedNodeIds.has(bId)) continue;
    }

    edgeKeys.add(makeEdgeKey(aId, bId));
  }

  return edgeKeys;
}
