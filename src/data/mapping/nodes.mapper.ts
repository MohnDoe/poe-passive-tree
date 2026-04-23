import type {
  NodeId,
  AscendancySubregion,
  PassiveNode,
  PassiveNodeNormalized,
  PassiveNodePosition,
  PassiveNodeKind,
} from "@/domain/models/passiveNode";
import { isPassiveNode, type PassiveTreeNodeDto } from "../dto/nodes.dto";
import type { PassiveSkillTreeDto } from "../dto/passiveSkillTree.dto";

export type NormalizedNodes = ReadonlyMap<NodeId, PassiveNodeNormalized>;

export function normalizeAndMapNodes(tree: PassiveSkillTreeDto): NormalizedNodes {
  const nodesIn = tree.nodes;
  const nodesOut: Map<NodeId, PassiveNodeNormalized> = new Map();
  for (const nodeId in nodesIn) {
    const nodeIn = nodesIn[nodeId]!;
    if (!isPassiveNode(nodeIn)) {
      continue;
    }

    const isClassStart = nodeIn.classStartIndex !== undefined;

    const nodeOut: PassiveNodeNormalized = {
      id: nodeId,
      name: nodeIn.name,
      out: nodeIn.out ?? [],
      in: nodeIn.in ?? [],
      orbit: nodeIn.orbit ?? 0,
      orbitIndex: nodeIn.orbit ?? 0,
      stats: nodeIn.stats,
      kind: getPassiveNodeKind(nodeIn),
      groupId: nodeIn.group?.toString() ?? undefined,
      position: getPassiveNodePosition(nodeId, tree),
      isMultipleChoice: nodeIn.isMultipleChoice ?? false,
      isMultipleChoiceOption: nodeIn.isMultipleChoiceOption ?? false,
      ascendancyName: nodeIn.ascendancyName ?? undefined,
      classStartIndex: isClassStart ? nodeIn.classStartIndex : undefined,
    };

    nodesOut.set(nodeId, nodeOut);
  }

  return nodesOut;
}

function getPassiveNodeKind(raw: PassiveTreeNodeDto): PassiveNodeKind {
  if (raw.isProxy) return "proxy";
  if (raw.isMastery) return "mastery";
  if (raw.isJewelSocket) return "jewel";
  if (raw.isAscendancyStart) return "ascendancyStart";
  if (raw.classStartIndex !== undefined) return "classStart";
  if (raw.isKeystone) return "keystone";
  if (raw.isNotable) return "notable";
  return "normal";
}

export function finalizedNodes(
  nodes: NormalizedNodes,
  subregionByNodeId: Map<NodeId, AscendancySubregion>,
): Map<NodeId, PassiveNode> {
  const nodesById: Map<NodeId, PassiveNode> = new Map();

  for (const [nodeId, normalizedNode] of nodes) {
    if (!normalizedNode) continue;
    const subregion = subregionByNodeId.get(nodeId);
    const node: PassiveNode = {
      ...normalizedNode,
      region: subregion ? "ascendancy" : "main",
      subregion: subregion ?? undefined,
    };

    nodesById.set(nodeId, node);
  }

  return nodesById;
}

function getPassiveNodePosition(
  nodeId: PassiveNode["id"],
  tree: PassiveSkillTreeDto,
): PassiveNodePosition | undefined {
  const node = tree.nodes[nodeId];
  if (!node) return;

  const { group, orbit, orbitIndex } = node;

  if (group === undefined || orbit === undefined || orbitIndex === undefined) {
    return;
  }

  const groupData = tree.groups[group];

  if (!groupData) return;

  const radius = tree.constants.orbitRadii[orbit];
  const skillsInOrbit = tree.constants.skillsPerOrbit[orbit];

  if (radius === undefined || skillsInOrbit === undefined || skillsInOrbit === 0) {
    return;
  }

  const angleStep = (2 * Math.PI) / skillsInOrbit;
  const angle = orbitIndex * angleStep;

  const x = groupData.x + Math.sin(angle) * radius;
  const y = groupData.y - Math.cos(angle) * radius;

  return { x, y };
}
