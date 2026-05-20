import { makeEdgeKey } from "../edgeKeys";
import type { GraphEdge } from "../GraphEdge";
import type { AscendancyId } from "../PassiveAscendancy";
import type { ClassId } from "../PassiveClass";
import type { PassiveGraph } from "../PassiveGraph";
import type { NodeId, PassiveNode, PassiveNodeRegion, PassiveNodeSubregion } from "../PassiveNode";

export function makeNode(partial: Partial<PassiveNode> & { id: NodeId }): PassiveNode {
  return {
    id: partial.id,
    name: partial.name ?? `node-${partial.id}`,
    stats: partial.stats ?? [],
    orbit: partial.orbit ?? 0,
    orbitIndex: partial.orbitIndex ?? 0,
    out: partial.out ?? [],
    in: partial.in ?? [],
    kind: partial.kind ?? "normal",
    isMultipleChoice: partial.isMultipleChoice ?? false,
    isMultipleChoiceOption: partial.isMultipleChoiceOption ?? false,
    groupId: partial.groupId,
    position: partial.position,
    ascendancyName: partial.ascendancyName,
    classStartIndex: partial.classStartIndex,
  };
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
  const startNodes = params.nodes.filter((n) => n.kind === "classStart");

  const firstClassStartNodes = startNodes.filter((n) => n.classStartIndex === firstClassId);
  const firstClassStartNodeIds = firstClassStartNodes.map((n) => n.id);

  const secondClassStartNodes = startNodes.filter((n) => n.classStartIndex === secondClassId);
  const secondClassStartNodeIds = secondClassStartNodes.map((n) => n.id);

  const allStartNodeIds = new Set<NodeId>([...firstClassStartNodeIds, ...secondClassStartNodeIds]);

  const ascendancyStartNodes = params.nodes.filter((n) => n.kind === "ascendancyStart");
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
    ascendancyIdsByClassId: new Map([
      [firstClassId, new Set()],
      [secondClassId, new Set()],
    ]),
    edges,
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
      makeNode({ id: "start-2", kind: "classStart", classStartIndex: 2 }),
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

  subregionByNodeId.set("0", null);
  subregionByNodeId.set("1", null);

  subregionByNodeId.set("2", "ascendancyA");
  subregionByNodeId.set("3", "ascendancyA");

  subregionByNodeId.set("4", "ascendancyB");
  subregionByNodeId.set("5", "ascendancyB");

  const graph = buildGraph({
    nodes: [
      makeNode({ id: "0", kind: "classStart", classStartIndex: 1 }),
      makeNode({ id: "1" }),
      makeNode({ id: "2", kind: "ascendancyStart", ascendancyName: "ascendancyA" }),
      makeNode({ id: "3", ascendancyName: "ascendancyA" }),
      makeNode({ id: "4", kind: "ascendancyStart", ascendancyName: "ascendancyB" }),
      makeNode({ id: "5", ascendancyName: "ascendancyB" }),
    ],
    edgePairs: [
      ["0", "1"],
      ["2", "3"],
      ["4", "5"],
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
    },
  };
}

export interface CustomAscendancyGraphFixture {
  graph: PassiveGraph;
}

export function makeCustomAscendancyGraph(): CustomAscendancyGraphFixture {
  const nodes = [
    makeNode({ id: "class-start", kind: "classStart", classStartIndex: 1 }),
    makeNode({ id: "normal-0" }),
  ];

  const graph = buildGraph({
    nodes,
    edgePairs: [["class-start", "normal-0"]],
    regionByNodeId: new Map(),
    subregionByNodeId: new Map(),
  });
  graph.ascendancyIdsByClassId = new Map([
    // NOTE: class 1 does not have an ascendancy
    [2 as ClassId, new Set(["class2Ascendancy"])],
    [3 as ClassId, new Set(["class3AscendancyA", "class3AscendancyB"])],
  ]);
  return { graph };
}
