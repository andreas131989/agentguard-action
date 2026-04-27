# Privacy

AgentGuard is designed to be privacy-first.

## Public beta privacy promise

AgentGuard:

- runs inside GitHub Actions
- does not use a hosted backend
- does not use a database
- does not call AI models
- does not send telemetry
- does not send source code to AgentGuard servers
- does not store customer repository data

## What AgentGuard reads

Inside the GitHub Actions workflow, AgentGuard uses GitHub’s API to read:

- pull request metadata
- pull request labels
- pull request author metadata
- branch metadata
- changed file metadata
- existing PR comments, only to find the previous AgentGuard comment

AgentGuard uses this information only inside the workflow run.

## What AgentGuard writes

AgentGuard may write:

- GitHub Actions workflow summary
- one PR conversation comment when the risk result meets the configured threshold

Repeated runs update the same AgentGuard comment using a hidden marker.

## What AgentGuard does not collect

AgentGuard does not collect or transmit to AgentGuard servers:

- source code
- file contents
- diffs
- repository names
- organization names
- branch names
- usernames
- PR titles
- PR bodies
- labels
- changed file lists
- risk results
- telemetry events
- analytics events

## AI usage

AgentGuard does not call AI models.

Risk analysis is deterministic.

## Telemetry

AgentGuard does not send telemetry.

There is no analytics backend in the public beta.

## Backend

AgentGuard does not have a hosted backend in the public beta.

There is no AgentGuard database, dashboard, webhook server, queue, or hosted API required to run the action.

## License key

The `license-key` input is reserved for future commercial beta usage.

In the public beta:

- it is optional
- it is not validated
- it is not sent to any license server
- it does not affect risk analysis
- it does not affect PR comments
- it does not affect workflow summaries

## Important limitation

AgentGuard runs in GitHub Actions and interacts with GitHub’s API according to the permissions granted by the workflow.

Review GitHub’s own privacy and data handling terms for GitHub Actions and GitHub API usage.