# Configuration

AgentGuard works without a config file.

By default, it uses:

```yaml
enabled: true
mode: ai-only
comment_threshold: high
```

You can customize AgentGuard by adding this file to your repository:

```text
.agentguard.yml
```

## Example config

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
  - "permissions/**"
  - "security/**"
  - "infra/**"
  - "migrations/**"
  - ".github/workflows/**"

ignore_paths:
  - "docs/**"
  - "*.md"
  - "generated/**"
  - "dist/**"
```

## Supported fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | boolean | `true` | Enables or disables AgentGuard |
| `mode` | string | `ai-only` | Controls when AgentGuard analyzes a PR |
| `comment_threshold` | string | `high` | Risk level required before AgentGuard posts a PR comment |
| `agent_authors` | string array | built-in defaults | Extra AI/bot author logins to detect |
| `critical_paths` | string array | built-in defaults | Extra sensitive path patterns |
| `ignore_paths` | string array | built-in defaults | Path patterns ignored before risk rules run |

## `enabled`

Disable AgentGuard without removing the workflow:

```yaml
enabled: false
```

When disabled, AgentGuard skips gracefully and writes a workflow summary.

## `mode`

Supported values:

```yaml
mode: ai-only
```

```yaml
mode: labeled
```

```yaml
mode: all-prs
```

### `ai-only`

Default. Analyze PRs that appear AI/bot-authored.

This is the recommended public beta default.

### `labeled`

Analyze PRs with AI/bot labels.

Useful when your team applies labels such as:

- `ai-generated`
- `agent-pr`
- `bot`
- `cursor`
- `copilot`
- `codex`
- `claude-code`
- `devin`

### `all-prs`

Analyze every PR.

Useful for evaluation, but noisier than `ai-only`.

## `comment_threshold`

Supported values:

```yaml
comment_threshold: low
```

```yaml
comment_threshold: medium
```

```yaml
comment_threshold: high
```

```yaml
comment_threshold: critical
```

Recommended default:

```yaml
comment_threshold: high
```

Default behavior:

| Risk level | Workflow summary | PR comment |
| --- | --- | --- |
| low | Yes | No |
| medium | Yes | No |
| high | Yes | Yes |
| critical | Yes | Yes |

## `agent_authors`

Add custom AI/bot account names:

```yaml
agent_authors:
  - "my-coding-agent[bot]"
  - "internal-agent"
```

AgentGuard also detects common AI/bot indicators from:

- author type
- author login
- branch name
- PR title
- PR body
- labels

## `critical_paths`

Add repository-specific sensitive paths:

```yaml
critical_paths:
  - "fraud/**"
  - "risk/**"
  - "platform/prod/**"
  - "internal/billing/**"
```

These patterns are merged with AgentGuard defaults.

## `ignore_paths`

Ignore generated, documentation, or low-risk paths:

```yaml
ignore_paths:
  - "snapshots/**"
  - "examples/generated/**"
  - "fixtures/**"
```

Ignored paths are removed before file-based risk rules run.

PR-level metadata signals, such as AI/bot authorship, may still apply.

## Glob support

AgentGuard uses a small deterministic path matcher.

It supports the MVP patterns used by AgentGuard defaults, including:

- bare filenames like `package.json`
- extension patterns like `*.ts`
- directory patterns like `auth/**`
- nested repository paths like `services/api/auth/session.ts`

It does not aim to be a full minimatch replacement in the public beta.

Unsupported advanced glob features include:

- brace expansion
- extglobs
- negation patterns
- character classes

## Unsupported config features

The public beta does not support:

- custom scoring weights
- blocking mode
- CODEOWNERS parsing
- team routing
- nested YAML objects
- anchors
- aliases
- multiline values
- external config URLs

## Action inputs override config

Workflow inputs override `.agentguard.yml` when provided:

```yaml
with:
  mode: ai-only
  comment-threshold: high
```

This lets teams keep repository config simple while enforcing workflow-level behavior.

## Config path

By default:

```yaml
with:
  config-path: .agentguard.yml
```

You can use another path:

```yaml
with:
  config-path: config/agentguard.yml
```

The workflow must use checkout before AgentGuard can read repository config:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: andreas131989/agentguard-action@v0.1.0
```