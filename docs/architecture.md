# Architecture

## Overview

This project is structured around **Domain-Driven Design (DDD)** principles adapted for a Vue.js based frontend-only application. The codebase is split into four explicit layers with strict unidirectional dependency rules:

```
Presentation  →  Application  →  Domain
     ↑                               ↑
Infrastructure  ──────────────────────
```

No layer may import from a layer above it and the `domain` layer had zero dependencies on any framework or library. `eslint-plugin-boundaries` is set up to enforce this statically.

---

## Layers

### Overview

```
src/
├── domain/         Pure TypeScript — no framework dependencies. Fully unit-testable.
│   ├── graph/      Passive tree graph model: nodes, edges, adjacency, graph queries
│   └── build/      Build-related algorithms, commands, models, and selectors
├── application/    Use cases orchestrating domain logic. No Vue, no Pinia.
│   └── build/      computeAllocationState, computeHoverPreviewState
├── infrastructure/ Fetches raw PoE tree JSON and maps it into domain types. DTOs and mappers only.
├── presentation/   Vue components, Pinia stores, Pixi rendering. Framework code lives here only.
└── shared/         Cross-cutting utilities and types
```

### `domain/`

The core of the application. Contains all business logic and data structures that describe what a passive tree _is_, independent of how it is displayed or loaded.

**Key entities:**

| Entity              | Responsibility                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `PassiveNode`       | A single node : id, type (normal/notable/keystone/mastery), position, stats, connections |
| `PassiveGraph`      | The aggregate root : a `Map<nodeId, PassiveNode>` with methods for graph traversal       |
| `PassiveGroup`      | A visual cluster of nodes sharing a background sprite                                    |
| `GraphEdge`         | The connection between two nodes; typed by visual kind                                   |
| `PassiveTreeData`   | The raw normalized tree data shape after parsing from GGG's JSON                         |
| `PassiveClass`      | Enum of the 7 character classes                                                          |
| `PassiveAscendancy` | Ascendancy sub-class type                                                                |

**Domain queries** (`domain/graph/queries/`) are pure functions that operate on these entities (e.g., finding the shortest path between two nodes, checking reachability, querying all connected nodes for a given allocation set.)

The domain layer deliberately avoids any reactive primitives (no `ref`, no `computed`). This makes the logic unit-testable in isolation.

---

### `application/`

Orchestrates domain logic to implement **use cases**. This layer knows about the `domain` but has no knowledge of Vue, Pixi.js, or Pinia.

**Key use cases:**

- **`computeAllocationState`** -- Given the current set of allocated node IDs and the full graph, returns a derived state object describing every node's allocation status (allocated, allocatable, unreachable, etc.). This is a pure function called reactively from the Pinia store.

- **`computeHoverPreviewState`** -- Given the hovered node and current allocation state, computes the path of nodes that would be allocated if the user clicks, enabling the visual hover preview of the click action (allocation or refund). Also a pure function.

- **`allocation/analysis/`** -- Supporting functions for pathfinding and reachability analysis used by the above.

The purity of these functions is a deliberate choice: it makes them trivially testable, easy to reason about, and free of side effects.

---

### `infrastructure/`

Handles the adaptation of external data formats into domain types.

- **`loader/`** -- Responsible for fetching the GGG-provided tree JSON (either bundled or remote), handling async loading state.
- **`passiveTree/`** -- Parses and normalizes the raw GGG JSON format into clean domain entities (`PassiveTreeData`, `PassiveNode`, etc.). This is where the messy external data format is isolated and normalized for future uses. The rest of the app never sees raw GGG JSON.

This pattern follows the **Anti-Corruption Layer** concept from DDD: external data is translated at the boundary, preventing foreign data shapes from leaking into the domain.

---

### `presentation/`

The Vue + Pixi.js UI layer. This is the only layer allowed to be stateful and reactive.

#### Pinia Stores

Stores act as the bridge between application logic and the UI. They are intentionally **thin** -- they hold state and delegate computation to the application layer.

| Store              | Responsibility                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `build.store`      | Currently selected class, ascendancy, and the set of allocated node IDs                            |
| `allocation.store` | Derived allocation state, computed by calling `computeAllocationState`                             |
| `runtime.store`    | Tree loading state, parsed tree data                                                               |
| `ui.store`         | Transient UI state -- hovered node ID, tooltip position, mastery display, sidebar visibility, etc. |

#### Pixi.js Rendering (`presentation/pixi/`)

The Pixi.js subsystem is organized as a mini scene-graph framework:

- **`stage/`** — Bootstraps the Pixi.js `Application`, sets up the root container and viewport
- **`scene/`** — Manages the collection of renderable objects; responsible for adding/removing views when the tree changes
- **`views/`** — `node.view.ts` and `edge.view.ts` are the renderable units. Each view owns its Pixi.js `Container` and exposes an `update(state)` method — no direct store access, just plain data in
- **`mappers/`** — Translate Pinia store state into the plain props passed to views, decoupling the rendering layer from the store shape
- **`models/`** — Pixi-specific data structures (display object wrappers, etc.)
- **`theme/`** — Centralized color palette and visual constants for consistent styling

#### Vue Components & Composables

Vue components are kept minimal — they handle layout, HTML-based UI (tooltips, panels, class selector) and delegate all canvas rendering to the Pixi.js subsystem via composables. The `presentation/composables/` folder bridges the reactive store world with the imperative Pixi.js world.

---

## Key Design Decisions

### Why DDD in a frontend app?

The passive tree is a **genuinely complex domain** with graph traversal, pathfinding, and multi-state node logic. Isolating this in a pure domain layer means it can be developed, tested, and reasoned about independently of any rendering concerns. When the visual design changes, the domain is untouched. When the game changes the tree format, only the infrastructure adapter changes.

### Why Pixi.js over SVG or pure Canvas?

The full Path of Exile passive tree **has 1500+ nodes and 2000+ edges**. SVG DOM manipulation at this scale degrades significantly. Pixi.js's WebGL renderer handles this with ease, and the retained-mode scene graph (as opposed to raw Canvas 2D) allows efficient per-frame partial updates -- only dirty views are re-rendered. Pixi.js also makes it easier to make it look good with backgrounds, sprite atlases and animation.

### Why pure functions in the application layer?

`computeAllocationState` and `computeHoverPreviewState` are the performance-critical paths of the application -- they run on every node hover and click. Pure functions are:

- **Predictable** : same input, same output, no surprises
- **Testable** : no mocking required
- **Memoizable** : a future optimization can wrap them with a cache keyed on the allocation set without changing their interface

### Why Pinia with a separate `allocation.store` and `build.store`?

`build` state (which nodes are selected) and `allocation` state (the derived rendering state) have different lifetimes and update frequencies. Separating them prevents unnecessary re-computation -- the allocation state is only recomputed when the build actually changes, not when UI state (hover, sidebar) changes.

### Why Bun?

Bun's native TypeScript support and fast instal times reduce friction. The project does not depend on any Bun-specific runtime APIs, so migrating to Node is trivially possible.
