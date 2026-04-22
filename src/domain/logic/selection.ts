import type { NormalizedNodes } from "@/data/mapping/nodes.mapper";
import type { ClassId } from "../models/passiveClass";
import type { NodeId } from "../models/passiveNode";
import { collectAscendancySeedNodeIds } from "../graph/ascendancy";

export function getStartNodeIdsForClass(nodes: NormalizedNodes, classId: ClassId): Set<NodeId> {
  const ids = new Set<NodeId>();
  const seedIds = collectAscendancySeedNodeIds(nodes);

  for (const seedId of seedIds) {
    const seedNode = nodes.get(seedId);
    if (!seedNode) continue;

    const subregion = seedNode.ascendancyName;
    if (!subregion) continue;

    if (subregion === classId) {
      ids.add(seedId);
    }
  }

  return ids;
}
