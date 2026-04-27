# Installation

Create this file in your repository:

```text
.github/workflows/agentguard.yml
```

## Recommended workflow

```yaml
name: AgentGuard

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  agentguard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: andreas131989/agentguard-action@v0.1.0
        with:
          mode: ai-only
          comment-threshold: high
```

## Required permissions

```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write
```

| Permission | Reason |
| --- | --- |
| `contents: read` | Allows checkout and config file access |
| `pull-requests: write` | Allows pull request metadata access in supported workflows |
| `issues: write` | Allows AgentGuard to create or update one PR comment |

GitHub PR comments use the Issues comments API, so `issues: write` is required for commenting.

## Inputs

```yaml
with:
  github-token: ${{ github.token }}
  config-path: .agentguard.yml
  mode: ai-only
  comment-threshold: high
```

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `github-token` | No | `${{ github.token }}` | Token used for GitHub API calls |
| `config-path` | No | `.agentguard.yml` | Optional config file path |
| `mode` | No | `ai-only` | When AgentGuard should run |
| `comment-threshold` | No | `high` | Risk level required before AgentGuard comments |
| `license-key` | No | Empty | Reserved for future commercial beta usage |

## Modes

### `ai-only`

Default. Analyze PRs that appear AI/bot-authored.

```yaml
with:
  mode: ai-only
```

Human PRs are skipped quietly in this mode.

### `labeled`

Analyze PRs with AI/bot labels.

```yaml
with:
  mode: labeled
```

### `all-prs`

Analyze every PR.

```yaml
with:
  mode: all-prs
```

This is useful for evaluation, but can be noisier than `ai-only`.

## Comment threshold

Default:

```yaml
with:
  comment-threshold: high
```

Supported values:

- `low`
- `medium`
- `high`
- `critical`

Default behavior:

| Risk level | Workflow summary | PR comment |
| --- | --- | --- |
| low | Yes | No |
| medium | Yes | No |
| high | Yes | Yes |
| critical | Yes | Yes |

## Optional config

AgentGuard works without a config file.

Optional `.agentguard.yml`:

```yaml
enabled: true
mode: ai-only
comment_threshold: high

agent_authors:
  - "github-copilot[bot]"
  - "cursor-agent"
  - "devin-ai"
  - "codex-agent"
  - "claude-code"

critical_paths:
  - "auth/**"
  - "billing/**"
  - "payments/**"
  - "infra/**"
  - "migrations/**"
  - ".github/workflows/**"

ignore_paths:
  - "docs/**"
  - "*.md"
  - "generated/**"
  - "dist/**"
```

## Local repository smoke test

For testing the action inside its own repository, use:

```yaml
- uses: ./
  with:
    mode: ai-only
    comment-threshold: high
```

Before using `uses: ./`, build the action:

```bash
npm run build
```

The action metadata points to:

```text
dist/index.cjs
```

## Evaluation mode

For temporary evaluation, you can use:

```yaml
with:
  mode: all-prs
  comment-threshold: low
```

This can produce more comments and should not be the default team setup.