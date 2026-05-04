import type { GraphEdge } from "../GraphEdge";
import type { ClassId } from "../PassiveClass";
import type { PassiveGraph } from "../PassiveGraph";
import type { NodeId, PassiveNode } from "../PassiveNode";

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
  const key = edge.key ?? `${edge.source}-${edge.target}`;
  return {
    key,
    source: edge.source,
    target: edge.target,
    isAscendancyTransition: edge.isAscendancyTransition ?? false,
    isMasteryLink: edge.isMasteryLink ?? false,
    isProxyTransition: edge.isProxyTransition ?? false,
  };
}

export function buildGraph(nodes: PassiveNode[], edgePairs: [NodeId, NodeId][]): PassiveGraph {
  const edges: GraphEdge[] = edgePairs.map(([source, target]) => makeEdge({ source, target }));
  const nodesById = new Map<NodeId, PassiveNode>(nodes.map((n) => [n.id, n]));
  const classId = 1 as ClassId;
  const classesById = new Map([[classId, { id: classId, name: "TestClass", ascendancyIds: [] }]]);

  const adjacency = new Map<NodeId, Set<NodeId>>();
  for (const n of nodes) adjacency.set(n.id, new Set());
  for (const e of edges) {
    adjacency.get(e.source)!.add(e.target);
    adjacency.get(e.target)!.add(e.source);
  }

  const regionByNodeId = new Map<NodeId, "main" | "ascendancy">(nodes.map((n) => [n.id, "main"]));
  const subregionByNodeId = new Map<NodeId, string | null>(nodes.map((n) => [n.id, null]));
  const startNodes = nodes.filter((n) => n.kind === "classStart");
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

/** Straight line: start(0) -- normal(1) -- normal(2) */
export function makeLineGraph(): PassiveGraph {
  return buildGraph(
    [
      makeNode({ id: "start", kind: "classStart", classStartIndex: 1 as ClassId }),
      makeNode({ id: "1" }),
      makeNode({ id: "end" }),
    ],
    [
      ["start", "1"],
      ["1", "end"],
    ],
  );
}

/** Fork: start(0) -- normal(1) -< normal(2)  <> normal(3) */
export function makeForkGraph(): PassiveGraph {
  return buildGraph(
    [
      makeNode({ id: "start", kind: "classStart", classStartIndex: 1 }),
      makeNode({ id: "1" }),
      makeNode({ id: "end-a" }),
      makeNode({ id: "end-b" }),
    ],
    [
      ["start", "1"],
      ["1", "end-a"],
      ["1", "end-b"],
    ],
  );
}
