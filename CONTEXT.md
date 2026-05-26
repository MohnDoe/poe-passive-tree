# POE Passive Tree

A domain glossary for the Path of Exile passive skill tree application — an interactive viewer that lets players construct and visualize character builds on the game's passive skill tree.

## Actions

**Build**:
The user's current configuration: which nodes are allocated, which character class and ascendancy are active, and the point budget.
_Avoid_: Allocation (use for the action, not the state)

**Allocate** (verb):
The action of assigning a passive point to a node. This consumes a passive point and marks the node as owned by the build.
_Avoid_: Select, claim, assign

**Refund** (verb):
The action of removing a node (and its dependency closure) from a build, returning its point cost.
_Avoid_: Deallocate, remove, unallocate

**Allocation** (noun):
The action of allocating or refunding a node. Distinguish from "build" which is the resulting state.
_Avoid_: Build (use for the state, not the action)

## Node Concepts

**Node kind**:
The type of a node, which determines allocation rules. Kinds are: `normal`, `notable`, `keystone`, `jewel`, `mastery`, `proxy`, `classStart`, and `ascendancyStart`.
_Avoid_: Type, category

**Keystone**:
A node kind with a single-select constraint: allocating one keystone de-allocates all other keystones of the same name. This is the primary gating mechanism for powerful node effects.
_Avoid_: Unique node, special node

**Jewel socket**:
A jewel node kind that acts as an empty socket. When a jewel is socketed, the jewel's nodes become part of the build and can affect reachability of nearby nodes.
_Avoid_: Jewel node (use "jewel socket" for the socket, "jewel" for the item)

**Start node**:
A non-allocatable anchor node that defines where a character class or ascendancy begins on the tree. It connects to the first allocatable nodes but cannot itself be allocated or refunded.
_Avoid_: Root node (see below), starting node

**Root node**:
An allocatable node that serves as a starting point for building a path on the tree. For a given build, root nodes are the allocatable nodes directly connected to the active class start node(s) and, if selected, the active ascendancy start node(s). Root nodes are the true BFS sources for pathfinding.
_Avoid_: Start node (see above), entry point

> **Note**: The code currently includes start nodes in `getActiveRootNodeIds` (treating them as BFS sources), but semantically start nodes are anchors, not root nodes. This is a code-domain naming mismatch.

**Region**:
A top-level partition of the tree. Values are `main` (the shared passive tree) and `ascendancy` (class-specific sub-trees). Traversal is confined to a single region.
_Avoid_: Area, zone, section

**Subregion**:
A named cluster within the ascendancy region — one per ascendancy specialization. Traversal is confined to a single subregion within ascendancy; you cannot traverse between ascendancy subregions.
_Avoid_: Cluster, area, part

## Graph Concepts

**Passive tree**:
The passive skill tree from Path of Exile — the game concept being modeled. Despite its name, it is a directed graph (not a tree) with 1500+ nodes and 2000+ edges. It contains the main tree, 7 class starting areas, and 8 ascendancy sub-trees.
_Avoid_: Skill tree (ambiguous — could mean the in-game UI), passive graph (see below)

**Passive graph**:
The domain model's representation of the passive tree. The aggregate root containing the node map, edge list, adjacency map, region/subregion mappings, and class/ascendancy relationships. All domain algorithms operate on the passive graph.
_Avoid_: Tree (see above), graph (too generic)

**Adjacency**:
A directed connection map: for each node, the set of nodes it points to. Used for efficient graph traversal. Adjacency is derived from the edge list and is part of the passive graph.
_Avoid_: Neighbors, connections

**Edge**:
A directed connection between two nodes. Edges carry metadata that constrains traversal: `isAscendancyTransition` marks edges crossing into an ascendancy subregion, `isMasteryLink` marks mastery-specific connections, and `isProxyTransition` marks proxy node transitions. Edges are unidirectional — they have a source and target.
_Avoid_: Link, connection (use for rendering, not the domain concept)

**Path**:
The cheapest sequence of nodes from a root node to a target node. The cost model determines what "cheapest" means (by default, allocated nodes are free to traverse and unallocated nodes cost 1 point). The path is what gets allocated when the user clicks a node, and what gets highlighted during hover preview.
_Avoid_: Route, chain, sequence

## Allocation Concepts

**Reachable**:
A node is reachable when there exists a valid traversal path from any active root node through the tree. Reachability is dynamic — it changes when the build changes, when ascendancy changes, or when jewel sockets are filled.
_Avoid_: Connected, accessible, available

**Allocatable**:
A node is allocatable when it is reachable AND its allocation would not exceed the point budget AND it passes all allocation rules (e.g., traversal constraints). A node can be reachable but not allocatable if the player is out of points.
_Avoid_: Available, eligible, unlockable

**Dependency**:
Node A depends on node B if and only if removing B from the build would make A unreachable from any root node. A node depends on itself trivially. In a diamond-shaped graph where node D has two parents B and C, D depends on neither B nor C — removing either one still leaves a path to D.
_Avoid_: Prerequisite, requirement, parent

**Refund closure**:
The complete set of nodes that must be refunded when a single node is refunded. It includes the refunded node, all nodes that depend on it, and all nodes that depend on those nodes (transitively). Computed by following dependency edges from the refunded node.
_Avoid_: Refund chain, cascade, ripple

## Budget

**Budget**:
The pool of available points for building a character. Split into two independent sub-types:

- **Passive budget** — points earned from leveling. Spent on normal, notable, and keystone nodes in the main tree.
- **Ascendancy budget** — points earned from completing ascendancy trials. Spent on ascendancy nodes.

Points are not transferable between sub-types. Unused points carry over.
_Avoid_: Points (use "budget" for the pool, "points" for the individual units)

**Point budget summary**:
A view of the budget showing how many passive and ascendancy points have been spent, and how many remain. This is a domain concept — it describes the state of the budget regardless of how it is presented (UI panel, console log, serialized state).
_Avoid_: Stats, counters, display

## Identity

**Class**:
One of the 7 character classes in Path of Exile. Determines the starting position on the passive tree and which ascendancies are available. Selecting a class resets the build (clears allocations and ascendancy).
_Avoid_: Character class (redundant), role, class type

**Ascendancy**:
A specialization within a class that unlocks a dedicated ascendancy sub-tree. Each class has a specific set of ascendancies. Selecting an ascendancy adds its start node to the root nodes and makes ascendancy-region nodes allocatable. Changing ascendancy removes all previously allocated ascendancy nodes.
_Avoid_: Ascendancy class, specialization, job

## Example Dialogue

> **Dev**: I want to add a "highlight allocatable nodes" feature. How do I know which nodes are allocatable?
>
> **Expert**: Iterate over the passive graph's nodes and check which ones are allocatable. A node is allocatable only if it's reachable from a root node, fits within the point budget, and passes traversal rules.
>
> **Dev**: So reachable and allocatable are different? A node could be reachable but not allocatable?
>
> **Expert**: Yes. Reachable means there's a valid path from a root. Allocatable adds the budget and rules constraints. If you're out of passive points, your reachable nodes are still reachable but none are allocatable.
>
> **Dev**: What about the hover preview? When I hover a node, what path gets highlighted?
>
> **Expert**: The path — the cheapest sequence from a root to that node. Allocated nodes are free to traverse, so the path minimizes unallocated nodes. The preview shows exactly what would be allocated if you clicked.
>
> **Dev**: And if I click a node that's already allocated?
>
> **Expert**: That's a refund. We compute the refund closure — the refunded node plus everything that depends on it. A node depends on another only if removing that other would make it unreachable. In a diamond graph, a node with two parents depends on neither parent.
>
> **Dev**: Got it. What happens if I switch ascendancy mid-build?
>
> **Expert**: Selecting an ascendancy adds its start node to the root nodes, making that ascendancy's subregion allocatable. Any nodes previously allocated in the old ascendancy subregion get removed. The start node itself is just an anchor — it's not allocatable, it's the root nodes connected to it that matter.
