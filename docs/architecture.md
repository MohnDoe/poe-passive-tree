# Architecture

## Layer Diagram

Domain → Application → Presentation
Infra →────────────↗

## Rules

- Domain: pure TypeScript. No Vue, no Pinia, no Pixi. Tested in isolation.
- Application : use cases. Takes domain types, returns domain types.
- Presentation: Vue/Pinia/Pixi only.
- Infra : DTOs + mappers. Feeds domain types into the app.

## Write Path vs Read Path

- Write Path: User action → store action → use case → new BuildState
- Read Path: BuildState change → buildAllocationSnapshot → Pixi render

The write path NEVER depends on the AllocationSnapshot.
The AllocationSnapshot is a READ MODEL for rendering only.

## Naming Conventions

- `*.usecase.ts` — Application use case. Framework-agnostic.
- `*.command.ts` — Pure domain command. Returns new state.
- `*.query.ts` — Pure domain query. Returns derived data.
- `*.snapshot.ts` — Expensive read model. UI use only.
- `*.mapper.ts` — Infra: DTO → domain.
- `*.store.ts` — Pinia store. Thin orchestrator only.
- `*.view.ts` — Pixi rendering view.
