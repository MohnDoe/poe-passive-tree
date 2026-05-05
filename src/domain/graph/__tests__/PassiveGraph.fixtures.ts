import { makeEdgeKey } from "../edgeKeys";
import type { GraphEdge } from "../GraphEdge";
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
  const classId = 1 as ClassId;
  const classesById = new Map([[classId, { id: classId, name: "TestClass", ascendancyIds: [] }]]);

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
  const allStartNodeIds = new Set<NodeId>(startNodes.map((n) => n.id));

  return {
    nodesById,
    groupsById: new Map(),
    classesById,
    bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    adjacency,
    regionByNodeId,
    subregionByNodeId,
    allStartNodeIds,
    startNodeIdsByClassId: new Map([[classId, allStartNodeIds]]),
    classByStartNodeId: new Map(startNodes.map((n) => [n.id, classId])),
    ascendancyStartNodeIds: new Set(),
    ascendancyStartNodeIdsByAscendancyId: new Map(),
    ascendancyIdsByClassId: new Map([[classId, new Set()]]),
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
  };
}

/** Straight line: start(0) -- normal(1) -- normal(2) */
export function makeLineGraph(): LineGraphFixture {
  const graph = buildGraph({
    nodes: [
      makeNode({ id: "start", kind: "classStart", classStartIndex: 1 }),
      makeNode({ id: "1" }),
      makeNode({ id: "2" }),
      makeNode({ id: "3" }),
    ],
    edgePairs: [
      ["start", "1"],
      ["1", "2"],
      ["2", "3"],
    ],
  });

  return {
    graph,
    nodes: {
      start: graph.nodesById.get("start")!,
      first: graph.nodesById.get("1")!,
      second: graph.nodesById.get("2")!,
      third: graph.nodesById.get("3")!,
    },
  };
}

/** Fork: start(0) -- normal(1) -< normal(2)  <> normal(3) */
export function makeForkGraph(): PassiveGraph {
  return buildGraph({
    nodes: [
      makeNode({ id: "start", kind: "classStart", classStartIndex: 1 }),
      makeNode({ id: "1" }),
      makeNode({ id: "end-a" }),
      makeNode({ id: "end-b" }),
    ],
    edgePairs: [
      ["start", "1"],
      ["1", "end-a"],
      ["1", "end-b"],
    ],
  });
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
