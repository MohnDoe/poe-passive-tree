import type { PassiveSkillTreeDto } from "@/data/dto/passiveSkillTree.dto";
import { buildBaseGraph } from "@/domain/graph/builder";
import type { ClassId, PassiveClass } from "@/domain/models/passiveClass";
import type { GroupId, PassiveGroup } from "@/domain/models/passiveGroup";
import type { NodeId, PassiveRootNode } from "@/domain/models/passiveNode";
import type { PassiveTree, PassiveTreeBounds } from "@/domain/models/passiveTree";
import { ROOT_NODE_ID, type PassiveTreeNodeDto } from "../dto/nodes.dto";
import { normalizeAndMapNodes } from "./nodes.mapper";

export function mapPassiveTreeDto(rawTree: PassiveSkillTreeDto): PassiveTree {
  const normalizedNodesById = normalizeAndMapNodes(rawTree);

  const baseTree = buildBaseGraph(normalizedNodesById);

  return {
    adjacency: baseTree.adjacency,
    edges: baseTree.edges,
    nodesById: baseTree.nodesById,
    classes: mapClasses(rawTree),
    groups: mapGroups(rawTree.groups),
    root: mapRootNode(rawTree.nodes),
    bounds: mapBounds(rawTree),
  };
}

function mapBounds(rTree: PassiveSkillTreeDto): PassiveTreeBounds {
  return {
    minX: rTree.min_x,
    minY: rTree.min_y,
    maxX: rTree.max_x,
    maxY: rTree.max_y,
  };
}

function mapRootNode(nodes: PassiveSkillTreeDto["nodes"]): PassiveRootNode {
  const rootNodeIn = nodes[ROOT_NODE_ID] ?? undefined;

  if (!rootNodeIn) {
    console.error("No root node");
    throw new Error("No root node!");
  }

  return {
    groupId: rootNodeIn.group?.toString() ?? "0",
    in: rootNodeIn.in ?? [],
    out: rootNodeIn.out ?? [],
    orbit: rootNodeIn.orbit ?? 0,
    orbitIndex: rootNodeIn.orbitIndex ?? 0,
  };
}

function mapGroups(groupsIn: PassiveSkillTreeDto["groups"]): PassiveTree["groups"] {
  const groupsOut: Map<GroupId, PassiveGroup> = new Map();

  for (const groupId in groupsIn) {
    const groupIn = groupsIn[groupId]!;

    const groupOut: PassiveGroup = {
      id: groupId,
      x: groupIn.x,
      y: groupIn.y,
      nodeIds: groupIn.nodes,
    };

    groupsOut.set(groupId, groupOut);
  }

  return groupsOut;
}

function mapClasses(tree: PassiveSkillTreeDto): Map<ClassId, PassiveClass> {
  const classesIn = tree.classes;
  const classesOut: Map<ClassId, PassiveClass> = new Map();

  for (const classId of classesIn.keys()) {
    const classIn = classesIn[classId]!;
    const classOut: PassiveClass = {
      id: classId,
      name: classIn.name,
      startNodeIds: getClassStartNodeIds(classId, tree),
    };

    classesOut.set(classId, classOut);
  }

  return classesOut;
}

function getClassStartNodeIds(classId: ClassId, tree: PassiveSkillTreeDto): Set<NodeId> {
  const nodeIds = new Set<NodeId>();
  for (const [nodeId, node] of Object.entries(tree.nodes)) {
    const idx = (node as PassiveTreeNodeDto).classStartIndex;
    if (idx && idx == classId) {
      nodeIds.add(nodeId);
    }
  }

  return nodeIds;
}
