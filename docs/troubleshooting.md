# Troubleshooting

## AgentGuard did not run

Check that your workflow is triggered on pull requests:

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
```

AgentGuard currently expects pull request events.

## AgentGuard skipped the PR

In default `ai-only` mode, AgentGuard skips PRs that do not appear AI/bot-authored.

To analyze every PR during evaluation:

```yaml
with:
  mode: all-prs
```

To analyze labeled PRs only:

```yaml
with:
  mode: labeled
```

## No PR comment appeared

By default, AgentGuard comments only on `high` or `critical` risk.

Low and medium risk PRs write a workflow summary only.

Check the workflow summary for:

```text
PR Comment Eligible: No
```

To lower the threshold during testing:

```yaml
with:
  comment-threshold: low
```

Use this carefully because it may create more noise.

## Permission error when creating comments

AgentGuard needs:

```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write
```

PR comments use GitHub’s Issues comments API.

Without `issues: write`, AgentGuard cannot create or update the PR comment.

If comments still fail, check the workflow run’s `Set up job` section and confirm `GITHUB_TOKEN` has `Issues: write`.

## Changed files could not be fetched

Check that the workflow has:

```yaml
permissions:
  pull-requests: write
```

Also confirm the workflow is running on a pull request event.

## Config file was not loaded

By default, AgentGuard looks for:

```text
.agentguard.yml
```

Missing config is normal. AgentGuard will use defaults.

To use a different path:

```yaml
with:
  config-path: config/agentguard.yml
```

The workflow must include checkout before running AgentGuard:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: andreas131989/agentguard-action@v0.1.0
```

## Invalid config error

AgentGuard MVP config supports only top-level fields:

```yaml
enabled: true
mode: ai-only
comment_threshold: high

agent_authors:
  - "custom-agent"

critical_paths:
  - "custom-sensitive/**"

ignore_paths:
  - "snapshots/**"
```

Unsupported:

- nested YAML objects
- anchors
- aliases
- multiline values
- custom scoring
- blocking mode
- CODEOWNERS
- team routing

## `enabled: false` skips analysis

This is expected.

```yaml
enabled: false
```

AgentGuard will skip gracefully and write a workflow summary.

It will not fetch changed files or post comments.

## AgentGuard updated a comment instead of creating a new one

This is expected.

AgentGuard uses this hidden marker:

```md
<!-- agentguard-risk-report -->
```

Repeated runs update the existing AgentGuard comment to avoid duplicates.

## AgentGuard created more noise than expected

Recommended default:

```yaml
mode: ai-only
comment_threshold: high
```

Avoid `all-prs` mode until you have evaluated behavior on your repository.

## AgentGuard missed a risky file

AgentGuard uses file-pattern detection, not semantic analysis.

Add custom sensitive paths:

```yaml
critical_paths:
  - "fraud/**"
  - "risk/**"
  - "platform/prod/**"
```

## AgentGuard flagged a harmless file

AgentGuard flags merge risk, not correctness.

Add ignored paths for low-risk generated, snapshot, or documentation areas:

```yaml
ignore_paths:
  - "snapshots/**"
  - "examples/generated/**"
```

## Action cannot find `dist/index.cjs`

The action metadata points to:

```text
dist/index.cjs
```

Before publishing or testing with `uses: ./`, run:

```bash
npm run build
```

The built `dist/index.cjs` file must be committed for the action to run from another repository.

## TypeScript, lint, or tests fail locally

Run the full validation set:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

## AgentGuard is not a security scanner

AgentGuard does not:

- prove code is safe
- prove code is correct
- perform security scanning
- perform AI code review
- replace human reviewers
- block merges by default

It flags merge risk so humans can review the right changes.

## Source code privacy concern

AgentGuard does not send source code to AgentGuard servers.

AgentGuard does not have a backend, database, telemetry pipeline, dashboard, or AI model integration in the public beta.

It uses GitHub’s API inside the workflow to read PR metadata, fetch changed file metadata, list comments, and create or update one PR comment when needed.

## Binary files

AgentGuard does not inspect file contents or binary data.

AgentGuard classifies changed files by path metadata and PR metadata only.