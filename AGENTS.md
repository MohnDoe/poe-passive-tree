## Toolchain

- Package manager: bun (`bun install`, `bun add`, `bun rm`)
- Test runner: vitest (`bun run test:unit` — not `bun test`; bun's built-in runner doesn't resolve Vite aliases. `bun run test:unit:coverage` for covarage)
- Build: `bun run build`

## Agent skills

### Issue tracker

Issues live as GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout. See `docs/agents/domain.md`.
