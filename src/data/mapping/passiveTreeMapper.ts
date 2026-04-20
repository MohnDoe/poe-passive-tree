import type { PassiveSkillTreeDto } from "@/data/dto/passiveSkillTree.dto";
import type { ClassId, PassiveClass } from "@/domain/models/passiveClass";
import type { GroupId, PassiveGroup } from "@/domain/models/passiveGroup";
import type { NodeId, PassiveNode, PassiveNodePosition, PassiveRootNode } from "@/domain/models/passiveNode";
import type { PassiveTree } from "@/domain/models/passiveTree";
import { isPassiveNode, ROOT_NODE_ID, type PassiveTreeNodeDto, type PassiveTreeNodeEntryDto } from "../dto/nodes.dto";

export function mapPassiveTreeDto(tree: PassiveSkillTreeDto): PassiveTree {
  return {
    adjacency: buildAdjacency(tree.nodes),
    classes: mapClasses(tree),
    groups: mapGroups(tree.groups),
    nodes: mapNodes(tree),
    root: mapRootNode(tree.nodes)
  }
}

function mapRootNode(nodes: PassiveSkillTreeDto['nodes']): PassiveRootNode {
  const rootNodeIn = nodes[ROOT_NODE_ID] ?? undefined;

  if (!rootNodeIn) {
    console.error('No root node');
    throw new Error("No root node!");
  }

  return {
    groupId: rootNodeIn.group?.toString() ?? undefined,
    in: rootNodeIn.in ?? [],
    out: rootNodeIn.out ?? [],
    orbit: rootNodeIn.orbit ?? undefined,
    orbitIndex: rootNodeIn.orbitIndex ?? undefined
  }
}

function mapNodes(tree: PassiveSkillTreeDto): PassiveTree['nodes'] {
  const nodesIn = tree.nodes;
  let nodesOut: Map<NodeId, PassiveNode> = new Map()
  for (const nodeId in nodesIn) {
    const nodeIn = nodesIn[nodeId]!;
    if (!isPassiveNode(nodeIn)) {
      continue;
    }
    let nodeType: PassiveNode['type'] = 'normal';

    if (nodeIn.isJewelSocket) {
      nodeType = 'jewel'
    }

    if (nodeIn.isKeystone) {
      nodeType = 'keystone';
    }

    if (nodeIn.isNotable) {
      nodeType = 'notable'
    }

    const nodeOut: PassiveNode = {
      id: nodeId,
      name: nodeIn.name,
      outgoing: nodeIn.out ?? [],
      stats: nodeIn.stats,
      type: nodeType,
      groupId: nodeIn.group?.toString() ?? undefined,
      position: getPassiveNodePosition(nodeId, tree)
    }

    nodesOut.set(nodeId, nodeOut)

  }

  return nodesOut;
}

function getPassiveNodePosition(nodeId: PassiveNode['id'], tree: PassiveSkillTreeDto): PassiveNodePosition | undefined {
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

  return { x, y }
}

function mapGroups(groupsIn: PassiveSkillTreeDto['groups']): PassiveTree['groups'] {
  let groupsOut: Map<GroupId, PassiveGroup> = new Map();

  for (const groupId in groupsIn) {
    const groupIn = groupsIn[groupId]!;

    const groupOut: PassiveGroup = {
      id: groupId,
      x: groupIn.x,
      y: groupIn.y,
      nodeIds: groupIn.nodes
    }

    groupsOut.set(groupId, groupOut)
  }

  return groupsOut;
}

function mapClasses(tree: PassiveSkillTreeDto): Map<ClassId, PassiveClass> {
  const classesIn = tree.classes;
  let classesOut: Map<ClassId, PassiveClass> = new Map();

  for (const classId in classesIn) {
    const classIn = classesIn[classId]!;

    const classOut: PassiveClass = {
      id: classId,
      name: classIn.name,
      startNodeIds: getClassStartNodeIds(classId, tree)
    }

    classesOut.set(classId, classOut)
  }

  return classesOut;
}

function getClassStartNodeIds(classId: ClassId, tree: PassiveSkillTreeDto): NodeId[] {
  const nodeIds: NodeId[] = [];
  for (const [nodeId, node] of Object.entries(tree.nodes)) {
    const idx = (node as PassiveTreeNodeDto).classStartIndex;
    if (idx && idx.toString() == classId) {
      nodeIds.push(nodeId);
    }
  }

  return nodeIds;
}

function buildAdjacency(nodes: PassiveSkillTreeDto['nodes']): PassiveTree['adjacency'] {
  const adj: Map<NodeId, NodeId[]> = new Map();

  const connect = (a: NodeId, b: NodeId) => {
    let listA = adj.get(a);
    if (!listA) {
      listA = [];
      adj.set(a, listA)
    }

    if (!listA.includes(b)) {
      listA.push(b);
    }
  }
  for (const [nodeId, node] of Object.entries(nodes)) {
    if (!adj.has(nodeId)) {
      adj.set(nodeId, []);
    }

    const ins = node.in ?? [];
    const outs = node.out ?? [];

    for (const target of outs) {
      connect(nodeId, target);
      connect(target, nodeId);
    }

    for (const source of ins) {
      connect(nodeId, source);
      connect(source, nodeId);
    }
  }

  return adj;
}
