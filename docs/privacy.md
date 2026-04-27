# Privacy

AgentGuard is designed to run entirely inside GitHub Actions.

It does not require AgentGuard-hosted infrastructure.

## No backend

AgentGuard does not use a backend.

There is no AgentGuard server involved in the MVP runtime.

## No database

AgentGuard does not store customer data.

There is no AgentGuard database in the MVP.

## No telemetry

AgentGuard does not send telemetry to AgentGuard servers.

It does not send:

- source code
- file contents
- filenames
- repository names
- organization names
- branch names
- pull request titles
- pull request bodies
- usernames
- labels
- risk results
- usage events
- analytics events

## No AI calls

AgentGuard does not call AI models.

It does not send code or metadata to LLM providers.

Risk detection is deterministic and local to the GitHub Actions workflow.

## GitHub API usage

AgentGuard uses GitHub’s API from inside the workflow to:

- read pull request metadata
- fetch changed file metadata
- list existing PR comments
- create or update one PR comment when risk meets the configured threshold

This data stays within GitHub Actions and your GitHub repository.

## Workflow summaries and PR comments

AgentGuard writes:

- GitHub Actions workflow summaries
- optional PR comments for high/critical risk by default

These may include:

- risk level
- risk score
- risk signal labels
- filenames from PR changed-file metadata
- recommended human review actions

These outputs are visible according to your repository and GitHub Actions permissions.

## Source code handling

AgentGuard does not upload source code to AgentGuard servers.

AgentGuard does not store source code.

AgentGuard does not require a database.

AgentGuard does not inspect full file contents for semantic analysis in the MVP.

## Config file handling

AgentGuard reads `.agentguard.yml` from the checked-out repository when present.

The config file is used only inside the GitHub Actions workflow.

It is not uploaded to AgentGuard servers.

## What may appear in GitHub output

AgentGuard may write the following to GitHub Actions summaries or PR comments:

- risk level
- risk score
- readable risk signal labels
- readable risk signal descriptions
- changed filenames associated with triggered signals
- recommended human review actions

This output remains inside GitHub.

## What AgentGuard does not do

AgentGuard does not:

- phone home
- collect telemetry
- upload source code
- upload diffs
- upload filenames
- upload repository metadata
- upload user metadata
- call AI models
- require a hosted service
- require account creation
- require a dashboard

## Limitations

AgentGuard cannot control:

- GitHub’s own data processing
- GitHub Actions log retention
- repository access settings
- organization access settings
- third-party actions used in the same workflow
- who can view PR comments
- who can view workflow summaries

Review your GitHub organization and repository settings for access control.
