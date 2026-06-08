import { makeEdgeKey } from "../edgeKeys";
import type { EdgeKey, GraphEdge } from "../GraphEdge";
import type { AscendancyId } from "../PassiveAscendancy";
import type { ClassId } from "../PassiveClass";
import type { PassiveGraph } from "../PassiveGraph";
import { PassiveNode, type NodeId, type PassiveNodeRegion, type PassiveNodeSubregion } from "../PassiveNode";

export function makeNode(partial: Partial<PassiveNode> & { id: NodeId }): PassiveNode {
  const kind = partial.kind ?? "normal";
  const base = {
    id: partial.id,
    name: partial.name ?? `node-${partial.id}`,
    stats: partial.stats ?? [],
    orbit: partial.orbit ?? 0,
    orbitIndex: partial.orbitIndex ?? 0,
    out: partial.out ?? [],
    in: partial.in ?? [],
    kind,
    groupId: partial.groupId,
    position: partial.position,
  };

  switch (kind) {
    case "normal": {
      return {
        ...base,
        ascendancyName: partial.ascendancyName,
        reminderText: partial.reminderText,
        grantedStrength: partial.grantedStrength,
        grantedDexterity: partial.grantedDexterity,
        grantedIntelligence: partial.grantedIntelligence,
        grantedPassivePoints: partial.grantedPassivePoints,
        isMultipleChoiceOption: partial.isMultipleChoiceOption,
      };
    }
    case "notable": {
      return {
        ...base,
        ascendancyName: partial.ascendancyName,
        reminderText: partial.reminderText,
        isBlighted: partial.isBlighted,
        recipe: partial.recipe,
        grantedStrength: partial.grantedStrength,
        grantedDexterity: partial.grantedDexterity,
        grantedIntelligence: partial.grantedIntelligence,
        grantedPassivePoints: partial.grantedPassivePoints,
        isMultipleChoice: partial.isMultipleChoice,
      };
    }
    case "keystone": {
      return {
        ...base,
        isBlighted: partial.isBlighted,
        recipe: partial.recipe,
        flavourText: partial.flavourText,
        reminderText: partial.reminderText,
      };
    }
    case "jewel": {
      return {
        ...base,
        ascendancyName: partial.ascendancyName,
        expansionJewel: partial.expansionJewel,
      };
    }
    case "mastery": {
      return {
        ...base,
        activeIcon: partial.activeIcon,
        inactiveIcon: partial.inactiveIcon,
        activeEffectImage: partial.activeEffectImage,
        masteryEffects: partial.masteryEffects,
      };
    }
    case "proxy": {
      return base;
    }
    case "classStart": {
      return {
        ...base,
        classStartIndex: partial.classStartIndex as ClassId,
      };
    }
    case "ascendancyStart": {
      return {
        ...base,
        ascendancyName: partial.ascendancyName,
      };
    }
  }
}

function makeEdge(edge: Partial<GraphEdge> & { source: NodeId; target: NodeId }): GraphEdge {
  const key = edge.key ?? makeEdgeKey(edge.source, edge.target);
  return {
    key,
    source: edge.source,
    target: edge.target,
    isAscendancyTransition: edge.isAscendancyTransition ?? false,
    isMasteryLink: edge.isMasteryLink ?? false,
    isProxyTransition: edge.isProxyTransition ?? false,
  };
}

export function buildGraph(params: {
  nodes: PassiveNode[];
  edgePairs: [NodeId, NodeId][];
  regionByNodeId?: Map<NodeId, PassiveNodeRegion>;
  subregionByNodeId?: Map<NodeId, PassiveNodeSubregion>;
}): PassiveGraph {
  const edges: GraphEdge[] = params.edgePairs.map(([source, target]) =>
    makeEdge({ source, target }),
  );
  const nodesById = new Map<NodeId, PassiveNode>(params.nodes.map((n) => [n.id, n]));
  const firstClassId = 1 as ClassId;
  const secondClassId = 2 as ClassId;
  const classesById = new Map([
    [firstClassId, { id: firstClassId, name: "TestClass", ascendancyIds: [] }],
    [secondClassId, { id: secondClassId, name: "TestClass2", ascendancyIds: [] }],
  ]);

  const adjacency = new Map<NodeId, Set<NodeId>>();
  for (const n of params.nodes) adjacency.set(n.id, new Set());
  for (const e of edges) {
    adjacency.get(e.source)!.add(e.target);
    adjacency.get(e.target)!.add(e.source);
  }

  const regionByNodeId =
    params.regionByNodeId ??
    new Map<NodeId, PassiveNodeRegion>(params.nodes.map((n) => [n.id, "main"]));
  const subregionByNodeId =
    params.subregionByNodeId ??
    new Map<NodeId, PassiveNodeSubregion>(params.nodes.map((n) => [n.id, null]));
  const startNodes = params.nodes.filter((n) => PassiveNode.isClassStart(n));

  const startNodeIdsByClassId = new Map<ClassId, Set<NodeId>>();
  const ascendancyIdsByClassId = new Map<ClassId, Set<AscendancyId>>();

  const firstClassStartNodes = startNodes.filter((n) => n.classStartIndex === firstClassId);
  const firstClassStartNodeIds = firstClassStartNodes.map((n) => n.id);
  startNodeIdsByClassId.set(firstClassId, new Set(firstClassStartNodeIds));

  const secondClassStartNodes = startNodes.filter((n) => n.classStartIndex === secondClassId);
  const secondClassStartNodeIds = secondClassStartNodes.map((n) => n.id);
  startNodeIdsByClassId.set(secondClassId, new Set(secondClassStartNodeIds));

  const allStartNodeIds = new Set<NodeId>([...firstClassStartNodeIds, ...secondClassStartNodeIds]);

  const ascendancyStartNodes = params.nodes.filter((n) => PassiveNode.isAscendancyStart(n));
  const ascendancyStartNodeIds = new Set<NodeId>(ascendancyStartNodes.map((n) => n.id));

  const ascendancyStartNodeIdsByAscendancyId = new Map<AscendancyId, ReadonlySet<NodeId>>();

  for (const n of ascendancyStartNodes) {
    if (!n.ascendancyName) continue;
    const existing = ascendancyStartNodeIdsByAscendancyId.get(n.ascendancyName) as
      | Set<NodeId>
      | undefined;
    if (existing) {
      existing.add(n.id);
    } else {
      ascendancyStartNodeIdsByAscendancyId.set(n.ascendancyName, new Set([n.id]));
    }
  }

  return {
    nodesById,
    groupsById: new Map(),
    classesById,
    bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    adjacency,
    regionByNodeId,
    subregionByNodeId,
    allStartNodeIds,
    startNodeIdsByClassId: new Map([
      [firstClassId, new Set(firstClassStartNodeIds)],
      [secondClassId, new Set(secondClassStartNodeIds)],
    ]),
    classByStartNodeId: new Map(startNodes.map((n) => [n.id, n.classStartIndex as ClassId])),
    ascendancyStartNodeIds,
    ascendancyStartNodeIdsByAscendancyId,
    ascendancyIdsByClassId: new Map(ascendancyIdsByClassId),
    edges,
    getBuildRootNodeIds(classId: ClassId | null, ascendancyId: AscendancyId | null) {
      const startNodeIds = this.getBuildStartNodeIds(classId, ascendancyId);

      const rootNodeIds = new Set<NodeId>();
      for (const startNodeId of startNodeIds) {
        const neighbors = adjacency.get(startNodeId);
        if (!neighbors) continue;
        for (const neighborId of neighbors) {
          const neighbor = nodesById.get(neighborId);
          if (neighbor && neighbor.kind !== "classStart" && neighbor.kind !== "ascendancyStart") {
            rootNodeIds.add(neighborId);
          }
        }
      }

      return rootNodeIds;
    },
    getBuildStartNodeIds(classId: ClassId | null, ascendancyId: AscendancyId | null) {
      const classStartNodeIds = this.getClassStartNodeIds(classId);
      const ascendancyStartNodeIds = this.getAscendancyStartNodeIds(ascendancyId);

      return new Set([...classStartNodeIds, ...ascendancyStartNodeIds]);
    },
    getClassStartNodeIds(classId: ClassId | null) {
      if (classId === null) return new Set();
      return startNodeIdsByClassId.get(classId) ?? new Set();
    },
    getAscendancyStartNodeIds(ascendancyId: AscendancyId | null) {
      if (ascendancyId === null) return new Set();
      return ascendancyStartNodeIdsByAscendancyId.get(ascendancyId) ?? new Set();
    },
    isValidAscendancyForClass(classId: ClassId, ascendancyId: AscendancyId) {
      return this.ascendancyIdsByClassId.get(classId)?.has(ascendancyId) ?? false;
    },
    computeEdgeKeysFromNodeIds(nodeIds: ReadonlySet<NodeId>): Set<EdgeKey> {
      const edgeKeys = new Set<EdgeKey>();
      for (const edge of edges) {
        if (!nodeIds.has(edge.source)) continue;
        if (!nodeIds.has(edge.target)) continue;
        edgeKeys.add(edge.key);
      }
      return edgeKeys;
    },
  };
}

export interface LineGraphFixture {
  graph: PassiveGraph;
  nodes: {
    start: PassiveNode;
    first: PassiveNode;
    second: PassiveNode;
    third: PassiveNode;
    fourth: PassiveNode;
    fifth: PassiveNode;
    sixth: PassiveNode;
    startOtherClass: PassiveNode;
  };
  edgePairs: [NodeId, NodeId][];
}

/** Straight line: start(0) -- 1 -- 2 -- 3 -- 4 -- 5 -- 6 */
export function makeLineGraph(): LineGraphFixture {
  const edgePairs: [NodeId, NodeId][] = [
    ["start", "1"],
    ["1", "2"],
    ["2", "3"],
    ["3", "4"],
    ["4", "5"],
    ["5", "6"],
    ["6", "start-2"],
  ];
  const graph = buildGraph({
    nodes: [
      makeNode({ id: "start", kind: "classStart", classStartIndex: 1 }),
      makeNode({ id: "1" }),
      makeNode({ id: "2" }),
      makeNode({ id: "3" }),
      makeNode({ id: "4" }),
      makeNode({ id: "5" }),
      makeNode({ id: "6" }),
      makeNode({ id: "start-2", kind: "classStart", classStartIndex: 1 }),
    ],
    edgePairs,
  });

  return {
    graph,
    nodes: {
      start: graph.nodesById.get("start")!,
      first: graph.nodesById.get("1")!,
      second: graph.nodesById.get("2")!,
      third: graph.nodesById.get("3")!,
      fourth: graph.nodesById.get("4")!,
      fifth: graph.nodesById.get("5")!,
      sixth: graph.nodesById.get("6")!,
      startOtherClass: graph.nodesById.get("start-2")!,
    },
    edgePairs,
  };
}

export interface ForkGraphFixture {
  graph: PassiveGraph;
  nodes: {
    start: PassiveNode;
    first: PassiveNode;
    left: {
      first: PassiveNode;
      second: PassiveNode;
    };
    right: {
      first: PassiveNode;
      second: PassiveNode;
    };
  };
}

/** Fork: start(0) -- normal(1) -< [left 1 -- left-2 <> right-1 -- right-2] */
export function makeForkGraph(): ForkGraphFixture {
  const graph = buildGraph({
    nodes: [
      makeNode({ id: "start", kind: "classStart", classStartIndex: 1 }),
      makeNode({ id: "1" }),
      makeNode({ id: "left-1" }),
      makeNode({ id: "left-2" }),
      makeNode({ id: "right-1" }),
      makeNode({ id: "right-2" }),
    ],
    edgePairs: [
      ["start", "1"],
      ["1", "left-1"],
      ["1", "right-1"],
      ["left-1", "left-2"],
      ["right-1", "right-2"],
    ],
  });

  return {
    graph,
    nodes: {
      start: graph.nodesById.get("start")!,
      first: graph.nodesById.get("1")!,
      left: {
        first: graph.nodesById.get("left-1")!,
        second: graph.nodesById.get("left-2")!,
      },
      right: {
        first: graph.nodesById.get("right-1")!,
        second: graph.nodesById.get("right-2")!,
      },
    },
  };
}

export interface DiamondGraphFixture {
  graph: PassiveGraph;
  nodes: {
    start: PassiveNode;
    left: {
      first: PassiveNode;
    };
    right: {
      first: PassiveNode;
      second: PassiveNode;
    };
    end: PassiveNode;
  };
}

/*
 * Creates an asymetrical diamond graph :
 * start -> left-1 -> end
 * start -> right-1 -> right-2 -> end
 * */

export function makeDiamondGraph(): DiamondGraphFixture {
  const graph = buildGraph({
    nodes: [
      makeNode({ id: "start", kind: "classStart", classStartIndex: 1 }),
      makeNode({ id: "left-1" }),
      makeNode({ id: "right-1" }),
      makeNode({ id: "right-2" }),
      makeNode({ id: "end" }),
    ],
    edgePairs: [
      ["start", "left-1"],
      ["start", "right-1"],
      ["right-1", "right-2"],
      ["left-1", "end"],
      ["right-2", "end"],
    ],
  });

  return {
    graph,
    nodes: {
      start: graph.nodesById.get("start")!,
      left: {
        first: graph.nodesById.get("left-1")!,
      },
      right: {
        first: graph.nodesById.get("right-1")!,
        second: graph.nodesById.get("right-2")!,
      },
      end: graph.nodesById.get("end")!,
    },
  };
}

export interface RegionGraphFixture {
  graph: PassiveGraph;
  nodes: {
    main: {
      start: PassiveNode;
      normal: PassiveNode;
    };
    ascendancyA: {
      start: PassiveNode;
      normal: PassiveNode;
    };
    ascendancyB: {
      start: PassiveNode;
      normal: PassiveNode;
    };
    ascendancyC: {
      start: PassiveNode;
      normal: PassiveNode;
    };
  };
}

export function makeRegionGraph(): RegionGraphFixture {
  /**
   * main:
   * 0 -- 1
   *
   * ascendancy:
   * 2 -- 3 (ascendancyA)
   * 4 -- 5 (ascendancyB)
   * 6 -- 7 (ascendancyC)
   *
   * */
  const regionByNodeId = new Map<NodeId, PassiveNodeRegion>();
  const subregionByNodeId = new Map<NodeId, PassiveNodeSubregion>();
  regionByNodeId.set("0", "main");
  regionByNodeId.set("1", "main");
  regionByNodeId.set("2", "ascendancy");
  regionByNodeId.set("3", "ascendancy");

  regionByNodeId.set("4", "ascendancy");
  regionByNodeId.set("5", "ascendancy");

  regionByNodeId.set("6", "ascendancy");
  regionByNodeId.set("7", "ascendancy");

  subregionByNodeId.set("0", null);
  subregionByNodeId.set("1", null);

  subregionByNodeId.set("2", "ascendancyA");
  subregionByNodeId.set("3", "ascendancyA");

  subregionByNodeId.set("4", "ascendancyB");
  subregionByNodeId.set("5", "ascendancyB");

  subregionByNodeId.set("6", "ascendancyC");
  subregionByNodeId.set("7", "ascendancyC");

  const graph = buildGraph({
    nodes: [
      makeNode({ id: "0", kind: "classStart", classStartIndex: 1 }),
      makeNode({ id: "1" }),
      makeNode({ id: "2", kind: "ascendancyStart", ascendancyName: "ascendancyA" }),
      makeNode({ id: "3", ascendancyName: "ascendancyA" }),
      makeNode({ id: "4", kind: "ascendancyStart", ascendancyName: "ascendancyB" }),
      makeNode({ id: "5", ascendancyName: "ascendancyB" }),
      makeNode({ id: "6", kind: "ascendancyStart", ascendancyName: "ascendancyC" }),
      makeNode({ id: "7", ascendancyName: "ascendancyC" }),
    ],
    edgePairs: [
      ["0", "1"],
      ["2", "3"],
      ["4", "5"],
      ["6", "7"],
    ],
    regionByNodeId,
    subregionByNodeId,
  });

  return {
    graph,
    nodes: {
      main: {
        start: graph.nodesById.get("0")!,
        normal: graph.nodesById.get("1")!,
      },
      ascendancyA: {
        start: graph.nodesById.get("2")!,
        normal: graph.nodesById.get("3")!,
      },
      ascendancyB: {
        start: graph.nodesById.get("4")!,
        normal: graph.nodesById.get("5")!,
      },
      ascendancyC: {
        start: graph.nodesById.get("6")!,
        normal: graph.nodesById.get("7")!,
      },
    },
  };
}

export interface CustomAscendancyGraphFixture extends RegionGraphFixture {
  classes: {
    noAscendancy: ClassId;
    oneAscendancy: ClassId;
    twoAscendancies: ClassId;
  };
}

export function makeCustomAscendancyGraph(): CustomAscendancyGraphFixture {
  const { graph, nodes } = makeRegionGraph();

  graph.ascendancyIdsByClassId = new Map([
    // NOTE: class 1 does not have an ascendancy
    [2 as ClassId, new Set(["ascendancyA"])],
    [3 as ClassId, new Set(["ascendancyB", "ascendancyC"])],
  ]);

  return {
    graph,
    nodes,
    classes: {
      noAscendancy: 1,
      oneAscendancy: 2,
      twoAscendancies: 3,
    },
  };
}
