# Risk Signals

AgentGuard uses deterministic risk signals to decide whether an AI/bot-created pull request may deserve extra human attention.

AgentGuard does not:

- prove code is safe
- prove code is correct
- perform security scanning
- perform AI code review
- understand code semantically
- parse ASTs
- replace human reviewers

It uses PR metadata and changed-file path metadata only.

## Risk levels

AgentGuard returns one of four risk levels:

| Level | Meaning |
| --- | --- |
| `low` | No major review-risk signals were detected |
| `medium` | Some review-risk signals are worth checking |
| `high` | The PR may deserve extra human attention before merge |
| `critical` | The PR combines high-impact review-risk signals and should receive careful human review before merge |

Default PR comment behavior:

| Risk level | Workflow summary | PR comment |
| --- | --- | --- |
| `low` | Yes | No |
| `medium` | Yes | No |
| `high` | Yes | Yes |
| `critical` | Yes | Yes |

## Signal: AI/bot authorship

AgentGuard detects whether a PR appears AI/bot-authored.

Detection can come from:

- GitHub author type
- author login
- configured `agent_authors`
- branch name
- PR title
- PR body
- labels

Examples:

```text
github-copilot[bot]
cursor-agent
devin-ai
codex-agent
claude-code
```

Common metadata markers include:

```text
ai
agent
bot
cursor
copilot
codex
claude-code
devin
```

This signal is used to decide whether AgentGuard should analyze a PR in `ai-only` mode.

## Signal: sensitive paths changed

Sensitive paths are areas where generated changes may deserve closer review.

Default examples include:

```text
auth/**
billing/**
payments/**
permissions/**
security/**
crypto/**
infra/**
terraform/**
k8s/**
migrations/**
.github/workflows/**
```

You can add repository-specific sensitive paths with:

```yaml
critical_paths:
  - "fraud/**"
  - "risk/**"
  - "platform/prod/**"
```

## Signal: dependency files changed

Dependency changes often affect build, runtime, and supply-chain behavior.

Examples include:

```text
package.json
package-lock.json
pnpm-lock.yaml
yarn.lock
requirements.txt
pyproject.toml
poetry.lock
go.mod
go.sum
Cargo.toml
Cargo.lock
Gemfile
Gemfile.lock
pom.xml
build.gradle
composer.json
composer.lock
*.csproj
packages.lock.json
```

AgentGuard does not inspect dependency contents or evaluate package reputation.

It only detects that dependency-related files changed.

## Signal: migration/schema/API schema files changed

Schema and migration changes can affect data, compatibility, and production behavior.

Examples include:

```text
migrations/**
db/migrate/**
database/migrations/**
supabase/migrations/**
schema.prisma
*.sql
*.graphql
graphql.schema
openapi.yaml
openapi.yml
swagger.yaml
swagger.json
*.proto
```

AgentGuard does not validate migrations or schemas.

It only flags that these files changed.

## Signal: CI/CD and deployment files changed

CI/CD and deployment changes can alter release, build, or infrastructure behavior.

Examples include:

```text
.github/workflows/**
.github/actions/**
.gitlab-ci.yml
.circleci/**
.buildkite/**
Jenkinsfile
azure-pipelines.yml
cloudbuild.yaml
Dockerfile
Dockerfile.*
docker-compose.yml
docker-compose.*.yml
deploy/**
deployment/**
infra/**
terraform/**
*.tf
*.tfvars
k8s/**
kubernetes/**
helm/**
charts/**
```

AgentGuard does not execute, validate, or secure deployment configuration.

It only flags that deployment-related files changed.

## Signal: source changed without tests

AgentGuard can flag source changes when no likely test files changed.

Examples of source files:

```text
src/**
app/**
lib/**
packages/**
*.ts
*.tsx
*.js
*.jsx
*.py
*.go
*.rs
*.rb
*.java
*.kt
*.php
*.cs
```

Examples of test files:

```text
*.test.ts
*.spec.ts
__tests__/**
tests/**
test_*.py
*_test.go
*_spec.rb
src/test/**
*Test.java
*Tests.cs
```

This signal is intentionally simple.

AgentGuard does not determine whether tests are required or sufficient.

It only detects that source files changed and likely test files did not.

## Signal: large PR

Large PRs can be harder to review carefully.

AgentGuard can flag PRs based on:

- changed file count
- total changed lines
- many unrelated top-level directories

Default thresholds may be adjusted before v1.0.

AgentGuard also enforces a maximum number of changed files analyzed by file-based rules to keep runtime predictable.

## Signal: secrets/env/credential-like files changed

AgentGuard flags obvious secret or credential-like paths.

Examples include:

```text
.env
.env.*
.envrc
*.pem
*.key
*.crt
*.p12
*.pfx
*.jks
*.keystore
.npmrc
.pypirc
.netrc
.ssh/**
.aws/credentials
kubeconfig*
*service-account*.json
```

AgentGuard does not inspect file contents.

It does not confirm that a real secret is present.

It only flags that a risky path changed.

## Ignored paths

Ignored paths are removed before file-based rules run.

Default examples include:

```text
docs/**
*.md
generated/**
dist/**
build/**
coverage/**
node_modules/**
vendor/**
.next/**
.nuxt/**
out/**
target/**
tmp/**
.cache/**
.terraform/**
```

Ignored paths help keep AgentGuard low-noise.

PR-level metadata signals, such as AI/bot authorship, may still apply.

## Critical upgrades

AgentGuard may upgrade a PR to `critical` when multiple high-impact signals combine.

Examples:

- AI/bot PR touches sensitive auth/payment/security areas and has no tests
- sensitive path + dependency file + migration/schema file all change together
- obvious secret/env/credential-like files change

Critical does not mean the PR is unsafe.

It means the PR deserves careful human review before merge.

## Scoring transparency

AgentGuard uses deterministic scoring.

The same input should produce the same result.

The score is a review-risk signal, not a correctness score.

Do not treat the score as proof that a PR is safe, unsafe, good, or bad.

## Recommended reviewer behavior

When AgentGuard flags a PR:

- review the highlighted files carefully
- confirm the PR intent matches the implementation
- verify dependency, migration, or deployment changes are intentional
- request or verify tests when behavior changes
- ask for a human owner review when sensitive areas are touched