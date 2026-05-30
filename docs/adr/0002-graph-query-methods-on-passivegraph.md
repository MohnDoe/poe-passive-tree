# Graph Query Methods on PassiveGraph

Query methods for the passive skill tree live directly on the `PassiveGraph` interface rather than in separate modules. Callers query the graph through a single seam instead of importing multiple query functions.

## Context

The original design placed graph queries in a `queries/` directory with separate modules (`getActiveRootNodeIds`, `getClassStartNodeIds`, etc.). Each query function accepted `PassiveGraph` as its first parameter and operated independently.

This was changed during the implementation of issue #49 to consolidate queries as methods on `PassiveGraph` itself.

## Decision

All graph query methods are implemented directly on the object returned by `buildGraph()`:

- `getBuildRootNodeIds(classId, ascendancyId)` — allocatable nodes connected to start nodes
- `getBuildStartNodeIds(classId, ascendancyId)` — class + ascendancy start node IDs
- `getClassStartNodeIds(classId)` — start node IDs for a class
- `getAscendancyStartNodeIds(ascendancyId)` — start node IDs for an ascendancy
- `isValidAscendancyForClass(classId, ascendancyId)` — validity check
- `computeEdgeKeysFromNodeIds(nodeIds)` — edges within a node set

The old query modules (`getActiveRootNodeIds`, `getClassStartNodeIds`) were deleted rather than kept as deprecated aliases.

The parameter name `rootNodeIds` was renamed to `startNodeIds` throughout the algorithm layer (`dependencies.ts`, `pathfinding.ts`) because "start node" is the accurate domain term — "root" was a code-domain naming mismatch.

## Considered Options

- **Separate query modules** (original approach) — each query is a standalone function in `queries/`. Pros: clear separation of concerns, easy to add new queries without touching the graph. Cons: callers must import multiple modules, the graph already has all the data it needs, no shared state between queries.
- **Query methods on PassiveGraph** (chosen) — all queries as methods on the graph object. Pros: single seam for callers, no separate modules to maintain, the graph already has all data, methods can share internal state. Cons: the interface grows, harder to isolate a single query for testing.
- **Query object / query service** — a separate class or object that receives the graph. Dismissed: adds unnecessary indirection when the graph already encapsulates all needed data.

## Start node reachability

In `AllocationState`, start node IDs (returned by `getBuildStartNodeIds`) are **not** marked as reachable. The allocation algorithm explicitly excludes them from reachability (`!buildStartNodeIds.has(nodeId)` in `applyWeightedPaths`), because start nodes are traversal origins, not destinations. They are also excluded from allocation (node kinds `classStart` and `ascendancyStart` are filtered in `applyAllocationFlags`). Downstream consumers should not treat start nodes as reachable allocatable targets.

## Consequences

- **Positive**: Callers interact with one seam (`graph.someQueryMethod()`) instead of importing multiple query modules. The graph object is self-contained — it has the data and the queries that operate on it.
- **Negative**: The `PassiveGraph` interface grows with each new query. Testing individual queries requires the full graph fixture setup rather than a simple function call.
- **Neutral**: The interface will keep growing as new query needs arise, but the pattern is consistent and discoverable — new methods belong on `PassiveGraph` rather than in `queries/`.
