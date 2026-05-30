import type {
  NodeId,
  PassiveNode,
  PassiveNodeCommon,
  PassiveNodeKind,
  PassiveNodePosition,
} from "@/domain/graph/PassiveNode";
import { type PassiveTreeNodeDto } from "../../dto/passiveTree/Nodes.dto";
import type { PassiveTreeDto } from "../../dto/passiveTree/PassiveSkillTree.dto";

export function mapPassiveNodeDto(
  nodeId: NodeId,
  raw: PassiveTreeNodeDto,
  tree: PassiveTreeDto,
): PassiveNode {
  const kind = getPassiveNodeKind(raw);
  const common: PassiveNodeCommon = {
    id: nodeId,
    name: raw.name,
    out: raw.out ?? [],
    in: raw.in ?? [],
    orbit: raw.orbit ?? 0,
    orbitIndex: raw.orbit ?? 0,
    stats: raw.stats,
    icon: raw.icon,
    groupId: raw.group?.toString() ?? undefined,
    position: getPassiveNodePosition(nodeId, tree),
    ascendancyName: raw.ascendancyName ?? undefined,
  };

  switch (kind) {
    case "ascendancyStart":
      return { ...common, kind, ascendancyName: raw.ascendancyName! };
    case "classStart":
      return { ...common, kind, classStartIndex: raw.classStartIndex! };
    case "mastery":
      return {
        ...common,
        kind,
        activeEffectImage: raw.activeEffectImage!,
        activeIcon: raw.activeIcon!,
        inactiveIcon: raw.inactiveIcon!,
      };
    case "notable":
    case "jewel":
    case "normal":
    case "keystone":
    case "proxy":
    case "multipleChoiceOption":
    case "multipleChoice":
    default:
      return { ...common, kind };
  }
}

function getPassiveNodeKind(raw: PassiveTreeNodeDto): PassiveNodeKind {
  if (raw.isProxy) return "proxy";
  if (raw.isMastery) return "mastery";
  if (raw.isJewelSocket) return "jewel";
  if (raw.isAscendancyStart) return "ascendancyStart";
  if (raw.classStartIndex !== undefined) return "classStart";
  if (raw.isKeystone) return "keystone";
  if (raw.isNotable) return "notable";
  if (raw.isMultipleChoice) return "multipleChoice";
  if (raw.isMultipleChoiceOption) return "multipleChoiceOption";
  return "normal";
}

function getPassiveNodePosition(
  nodeId: PassiveNode["id"],
  tree: PassiveTreeDto,
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
