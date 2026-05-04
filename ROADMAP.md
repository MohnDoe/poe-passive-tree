# Roadmap

This document tracks the planned development of the Path of Exile Passive Tree project. Items are roughly ordered by priority.

---

## ✅ Completed

- [x] Domain model -- `PassiveNode`, `PassiveGraph`, `PassiveGroup`, `GraphEdge`
- [x] Infrastructure layer -- GGG tree JSON parsing and normalization
- [x] Pixi.js scene bootstrapping (stage, viewport, scene graph)
- [x] Node and edge rendering with `node.view.ts` / `edge.view.ts`
- [x] Pinia stores — `build`, `allocation`, `runtime`, `ui`
- [x] `computeAllocationState` — pure function resolving full node allocation state
- [x] `computeHoverPreviewState` — real-time path preview on hover
- [x] Domain queries folder — composable graph query functions
- [x] Class and Ascendancy domain types
- [x] Ascendancy sub-tree rendering and allocation
- [x] Node count display (allocated / max)

---

## 🚧 In Progress

- [ ] Unit tests
- [ ] Full hover tooltip with node stat display
- [ ] Pixi.js asset pipeline — sprite loading for node frames, backgrounds, and connectors

---

## 🗓 Short Term (v0.2 - Q3 2026)

- [ ] Node search — highlight matching nodes across the tree
- [ ] Viewport zoom/pan polish (inertia, min/max bounds)
- [ ] Class starting node highlight and auto-centering
- [ ] Stat aggregation — sum all allocated node modifiers into a stat panel

---

## 🗓 Medium Term (v0.3)

- [ ] Minimap for large-scale navigation
- [ ] Build URL encoding — serialize/deserialize allocated nodes to a shareable URL hash
- [ ] Tree version comparison

---

## 🗓 Long Term / Stretch Goals

- [ ] Import from Path of Building build codes
- [ ] Build planner — named builds with save/load support (localStorage)
- [ ] Export to Path of Building
- [ ] Animated allocation transitions (Pixi.js tween/ticker)
- [ ] Mobile / touch support (pinch zoom, tap)
- [ ] PWA support for offline use

---

## 🔧 Technical Debt & Refactoring

- [ ] Increase unit test coverage for `computeAllocationState` and graph queries
- [ ] Complete Pixi.js asset registry (`assets.ts` is currently a stub)
- [ ] CI pipeline — typecheck, lint, test on PR
- [ ] Strict ESLint rules enforcement across the entire codebase
