import type {
  NodeId,
  PassiveNode,
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
  const base = {
    id: nodeId,
    name: raw.name,
    out: raw.out ?? [],
    in: raw.in ?? [],
    orbit: raw.orbit ?? 0,
    orbitIndex: raw.orbitIndex ?? 0,
    stats: raw.stats,
    kind,
    groupId: raw.group?.toString() ?? undefined,
    position: getPassiveNodePosition(nodeId, tree),
  };

  switch (kind) {
    case "normal": {
      return {
        ...base,
        kind: "normal" as const,
        ascendancyName: raw.ascendancyName,
        reminderText: raw.reminderText,
        grantedStrength: raw.grantedStrength,
        grantedDexterity: raw.grantedDexterity,
        grantedIntelligence: raw.grantedIntelligence,
        grantedPassivePoints: raw.grantedPassivePoints,
        isMultipleChoiceOption: raw.isMultipleChoiceOption,
      };
    }
    case "notable": {
      return {
        ...base,
        kind: "notable" as const,
        ascendancyName: raw.ascendancyName,
        reminderText: raw.reminderText,
        isBlighted: raw.isBlighted,
        recipe: raw.recipe,
        grantedStrength: raw.grantedStrength,
        grantedDexterity: raw.grantedDexterity,
        grantedIntelligence: raw.grantedIntelligence,
        grantedPassivePoints: raw.grantedPassivePoints,
        isMultipleChoice: raw.isMultipleChoice,
      };
    }
    case "keystone": {
      return {
        ...base,
        kind: "keystone" as const,
        isBlighted: raw.isBlighted,
        recipe: raw.recipe,
        flavourText: raw.flavourText,
        reminderText: raw.reminderText,
      };
    }
    case "jewel": {
      return {
        ...base,
        kind: "jewel" as const,
        ascendancyName: raw.ascendancyName,
        expansionJewel: raw.expansionJewel,
      };
    }
    case "mastery": {
      return {
        ...base,
        kind: "mastery" as const,
        activeIcon: raw.activeIcon as string | undefined,
        inactiveIcon: raw.inactiveIcon as string | undefined,
        activeEffectImage: raw.activeEffectImage as string | undefined,
        masteryEffects: raw.masteryEffects,
      };
    }
    case "proxy": {
      return {
        ...base,
        kind: "proxy" as const,
      };
    }
    case "classStart": {
      return {
        ...base,
        kind: "classStart" as const,
        classStartIndex: raw.classStartIndex as number,
      };
    }
    case "ascendancyStart": {
      return {
        ...base,
        kind: "ascendancyStart" as const,
        ascendancyName: raw.ascendancyName,
      };
    }
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
