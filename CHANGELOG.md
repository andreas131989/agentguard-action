# Changelog

All notable changes to AgentGuard will be documented in this file.

## 0.0.0 — Public beta foundation

Initial public beta foundation.

### Added

- TypeScript GitHub Action foundation
- Deterministic local risk engine
- GitHub Action runtime integration
- Pull request changed-file fetching
- Workflow summary output
- PR comment rendering and upsert behavior
- Hidden marker for one AgentGuard PR comment
- Lightweight `.agentguard.yml` config support
- Default AI/bot PR detection
- Default sensitive path detection
- Default dependency file detection
- Default migration/schema file detection
- Default CI/CD/deployment file detection
- Default source-changed-without-tests detection
- Default large PR detection
- Default obvious secret/credential-like file detection
- Language-aware file-pattern detection across common ecosystems
- Unit tests for risk rules, scoring, config, rendering, comments, and action runtime boundaries
- Public beta documentation and examples

### Defaults

- Default mode: `ai-only`
- Default comment threshold: `high`
- Default behavior: non-blocking
- Default privacy posture: no backend, no database, no telemetry, no AI calls
- Default PR comment behavior: comments only on high or critical risk

### Current product boundary

AgentGuard does not:

- prove code is safe
- prove code is correct
- replace human reviewers
- perform security scanning
- perform AI code review
- understand code semantically
- call AI models
- send telemetry
- use a backend
- use a database
- provide a dashboard
- block merges by default

### Not included

- hosted backend
- database
- dashboard
- billing system
- license server
- telemetry
- AI code review
- LLM calls
- security scanning
- AST parsing
- semantic code analysis
- blocking checks
- CODEOWNERS parsing
- team routing
- GitLab support
- Bitbucket support
