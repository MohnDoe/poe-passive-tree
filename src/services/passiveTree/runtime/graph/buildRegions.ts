import type { MappedPassiveTree } from "@/data/mapping/MappedPassiveTree";
import type { PassiveGraph, PassiveTreeAdjacency } from "@/domain/passiveGraph/PassiveGraph";
import type {
  NodeId,
  PassiveNodeRegion,
  PassiveNodeSubregion,
} from "@/domain/passiveGraph/PassiveNode";
import { traverseAscendancyRegion } from "../../allocation/rules/traversal";

export interface RegionIndexes {
  regionByNodeId: PassiveGraph["regionByNodeId"];
  subregionByNodeId: PassiveGraph["subregionByNodeId"];
}

export function buildRegionIndexes(
  input: MappedPassiveTree,
  ascendancyStartNodeIds: PassiveGraph["ascendancyStartNodeIds"],
  adjacendy: PassiveTreeAdjacency,
): RegionIndexes {
  const subregionByNodeId = new Map<NodeId, PassiveNodeSubregion>();
  const regionByNodeId = new Map<NodeId, PassiveNodeRegion>();

  // default all nodes to main region and no subregion
  for (const nodeId of input.nodesById.keys()) {
    subregionByNodeId.set(nodeId, null);
    regionByNodeId.set(nodeId, "main");
  }

  for (const seedId of ascendancyStartNodeIds) {
    const seedNode = input.nodesById.get(seedId);
    if (!seedNode) continue;

    const subregion = seedNode.ascendancyName;
    if (!subregion) continue;

    subregionByNodeId.set(seedId, subregion);
    regionByNodeId.set(seedId, "ascendancy");

    const visited = traverseAscendancyRegion(seedNode, adjacendy, input.nodesById);

    for (const nodeId of visited) {
      regionByNodeId.set(nodeId, "ascendancy");
      subregionByNodeId.set(nodeId, subregion);
    }
  }

  return {
    subregionByNodeId,
    regionByNodeId,
  };
}
