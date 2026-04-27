# Security Policy

AgentGuard is currently in public beta.

## Supported versions

| Version | Support |
| --- | --- |
| `v0.1.x` | Public beta support |

## Security contact

Please report security issues privately.

Contact:

```text
andreas131989@users.noreply.github.com
```

Do not open public GitHub issues for security-sensitive reports.

## Security model

AgentGuard is designed to run entirely inside GitHub Actions.

AgentGuard does not require:

- hosted backend
- database
- dashboard
- telemetry pipeline
- AI model
- webhook server
- license server

AgentGuard does not send source code, file contents, repository names, branch names, usernames, PR titles, PR bodies, labels, or risk results to AgentGuard servers.

## Network behavior

AgentGuard uses GitHub’s API from inside the workflow to:

- read pull request metadata
- fetch changed file metadata
- list PR comments
- create or update one PR comment when needed

AgentGuard does not call external AI services.

AgentGuard does not phone home.

## Permissions

Recommended workflow permissions:

```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write
```

Why:

| Permission | Reason |
| --- | --- |
| `contents: read` | Allows checkout and config file access |
| `pull-requests: write` | Allows pull request metadata access in supported workflows |
| `issues: write` | Allows creating/updating one PR conversation comment |

GitHub PR comments use the Issues comments API.

## Product boundaries

AgentGuard does not:

- prove code is safe
- prove code is correct
- perform security scanning
- perform AI code review
- replace human reviewers
- block merges by default
- inspect source code semantics
- parse ASTs

AgentGuard flags review risk using deterministic file-pattern and PR-metadata signals.

## Dependency and supply chain notes

AgentGuard is a JavaScript GitHub Action.

The built action entrypoint is:

```text
dist/index.cjs
```

Before publishing a release, maintainers should run:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

The bundled `dist` output should be committed for GitHub Action usage.

## Reporting

When reporting a security issue, please include:

- affected version or commit SHA
- summary of the issue
- reproduction steps if possible
- expected impact
- whether the issue affects public or private repository usage