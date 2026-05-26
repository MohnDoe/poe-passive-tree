# DDD-Inspired Layer Boundaries

The codebase uses four layers — domain, application, infrastructure, presentation — with unidirectional dependencies enforced by eslint-plugin-boundaries. This is not strict DDD or Clean Architecture; it takes the anti-corruption layer from DDD, the pure-function application layer from Clean Architecture, and drops the rigid rules (repositories, domain events, use-case classes, aggregate invariants). The goal is testable domain logic and rendering independence, not architectural purity.

## Considered Options

- **Flat `src/` with feature folders** — dismissed because the graph domain (1500+ nodes, pathfinding, allocation rules) is complex enough to warrant isolation. A flat structure would mix graph algorithms with rendering concerns.
- **Strict DDD** — dismissed because repositories, domain events, and aggregate invariants add ceremony without proportional value for a single-person frontend project.
- **Strict Clean Architecture** — dismissed because the anti-corruption layer (DTOs + mappers) is more valuable for this project than Clean Architecture's interface-adapters pattern.

## Consequences

- **Positive**: Domain logic is pure, framework-free, and trivially testable. When the visual design changes, the domain is untouched. When GGG changes the tree format, only the infrastructure adapter changes.
- **Negative**: More files and indirection. A simple click handler goes through store → application function → domain algorithm. The layering is harder to explain to a new contributor.
- **Neutral**: The architecture is heavier than the current scope requires, but the domain layer's purity earns its keep.
