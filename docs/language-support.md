# Language and Ecosystem Support

AgentGuard is language-agnostic by design.

It does not parse source code, inspect ASTs, run linters, or understand code semantically.

Instead, AgentGuard uses deterministic file-pattern detection across common ecosystems.

Preferred wording:

> Language-aware file-pattern detection, not language parsing.

## Supported repository types

AgentGuard can run on any GitHub repository.

Default file-pattern coverage is strongest for:

- JavaScript / TypeScript
- Python
- Go
- Rust
- Ruby
- Java / Kotlin
- PHP
- .NET
- SQL / schema files
- Terraform / infrastructure files
- Docker
- GitHub Actions / CI

## JavaScript / TypeScript

Common source patterns:

```text
src/**
app/**
lib/**
packages/**
*.ts
*.tsx
*.js
*.jsx
*.mjs
*.cjs
```

Common test patterns:

```text
*.test.ts
*.test.tsx
*.spec.ts
*.spec.tsx
*.test.js
*.spec.js
__tests__/**
tests/**
```

Common dependency patterns:

```text
package.json
package-lock.json
npm-shrinkwrap.json
pnpm-lock.yaml
pnpm-workspace.yaml
yarn.lock
bun.lock
bun.lockb
deno.json
deno.jsonc
deno.lock
```

## Python

Common source patterns:

```text
*.py
src/**
app/**
```

Common test patterns:

```text
test_*.py
*_test.py
tests/**
```

Common dependency patterns:

```text
requirements.txt
requirements*.txt
pyproject.toml
poetry.lock
Pipfile
Pipfile.lock
setup.py
setup.cfg
uv.lock
```

## Go

Common source patterns:

```text
*.go
```

Common test patterns:

```text
*_test.go
```

Common dependency patterns:

```text
go.mod
go.sum
go.work
go.work.sum
```

## Rust

Common source patterns:

```text
*.rs
```

Common test patterns:

```text
tests/**
*_test.rs
```

Common dependency patterns:

```text
Cargo.toml
Cargo.lock
```

## Ruby

Common source patterns:

```text
*.rb
app/**
lib/**
```

Common test patterns:

```text
spec/**
test/**
*_spec.rb
```

Common dependency patterns:

```text
Gemfile
Gemfile.lock
gems.rb
gems.locked
```

## Java / Kotlin

Common source patterns:

```text
src/main/**
*.java
*.kt
*.kts
```

Common test patterns:

```text
src/test/**
*Test.java
*Tests.java
*Test.kt
*Tests.kt
```

Common dependency patterns:

```text
pom.xml
build.gradle
build.gradle.kts
settings.gradle
settings.gradle.kts
gradle.lockfile
gradle/libs.versions.toml
```

## PHP

Common source patterns:

```text
*.php
src/**
app/**
```

Common test patterns:

```text
tests/**
*Test.php
```

Common dependency patterns:

```text
composer.json
composer.lock
```

## .NET

Common source patterns:

```text
*.cs
*.fs
*.vb
```

Common test patterns:

```text
*Tests.cs
*.Tests/**
tests/**
```

Common dependency patterns:

```text
*.csproj
*.fsproj
*.vbproj
*.sln
packages.lock.json
packages.config
Directory.Packages.props
NuGet.config
global.json
```

## SQL / schema / API files

Common migration and schema patterns:

```text
migrations/**
db/migrate/**
db/migrations/**
database/migrations/**
supabase/migrations/**
src/main/resources/db/migration/**
liquibase/**
schema.prisma
db/schema.rb
*.sql
*.graphql
graphql.schema
openapi.yaml
openapi.yml
openapi.json
swagger.yaml
swagger.yml
swagger.json
*.proto
```

## Terraform / infrastructure

Common infrastructure patterns:

```text
infra/**
terraform/**
*.tf
*.tfvars
.terraform.lock.hcl
k8s/**
kubernetes/**
helm/**
charts/**
helmfile.yaml
helmfile.yml
skaffold.yaml
skaffold.yml
kustomization.yaml
kustomization.yml
```

## Docker

Common Docker and Compose patterns:

```text
Dockerfile
Dockerfile.*
.dockerignore
docker-compose.yml
docker-compose.yaml
docker-compose.*.yml
docker-compose.*.yaml
compose.yml
compose.yaml
```

## GitHub Actions / CI

Common CI/CD patterns:

```text
.github/workflows/**
.github/actions/**
.gitlab-ci.yml
.circleci/**
.buildkite/**
Jenkinsfile
azure-pipelines.yml
azure-pipelines.yaml
cloudbuild.yml
cloudbuild.yaml
```

## Secret and credential-like files

AgentGuard flags obvious secret or credential-like paths.

Examples:

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
*kubeconfig*
*service-account*.json
```

AgentGuard does not inspect file contents.

It only classifies changed files by path metadata.

## Ignored paths

AgentGuard ignores common generated, vendor, build, cache, and documentation paths before file-based rules run.

Examples:

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

PR-level metadata signals, such as AI/bot authorship, may still apply.

## What AgentGuard does not do

AgentGuard does not:

- parse ASTs
- inspect source code semantics
- run language-specific compilers
- run linters
- run tests
- inspect file contents
- inspect binary contents
- evaluate dependency reputation
- validate migrations
- validate Terraform plans
- scan for vulnerabilities
- prove code is safe
- prove code is correct

## Adding custom paths

Use `.agentguard.yml` to add repository-specific sensitive paths:

```yaml
critical_paths:
  - "fraud/**"
  - "risk/**"
  - "platform/prod/**"
```

Use ignored paths to reduce noise:

```yaml
ignore_paths:
  - "snapshots/**"
  - "examples/generated/**"
```

## Glob behavior

AgentGuard uses a small deterministic path matcher.

It supports the common MVP patterns used by the default rules, including:

- bare filenames like `package.json`
- extension patterns like `*.ts`
- directory patterns like `auth/**`
- nested paths like `services/api/auth/session.ts`

It does not aim to be a full minimatch replacement in the public beta.

Unsupported advanced glob features include:

- brace expansion
- extglobs
- negation patterns
- character classes