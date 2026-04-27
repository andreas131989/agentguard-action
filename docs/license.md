# License

AgentGuard public beta licensing is intentionally simple.

Repository license files:

- `LICENSE.md`
- `COMMERCIAL-LICENSE.md`

## Public beta

The current public beta is focused on GitHub Actions usage and feedback.

The action includes a `license-key` input reserved for future commercial beta usage, but the current public beta does not implement:

- license server
- billing system
- hosted validation
- telemetry
- dashboard
- account creation

## Commercial beta

Interested in using AgentGuard for private or commercial repositories?

Contact:

```text
andreas131989@users.noreply.github.com
```

## No license enforcement in the action

The current action does not call any external license server.

It does not phone home.

It does not send repository metadata to AgentGuard servers.

It does not send source code, filenames, branch names, usernames, PR titles, PR bodies, labels, or risk results to AgentGuard servers.

## Current `license-key` behavior

The `license-key` action input is reserved for future commercial beta usage.

In the current public beta:

- it is optional
- it is not required
- it is not validated
- it is not sent anywhere
- it does not affect risk analysis
- it does not affect PR comments
- it does not affect workflow summaries

## Important product boundary

AgentGuard does not prove code is safe or correct.

AgentGuard is a deterministic merge-risk signal for AI/bot-created pull requests.

Human reviewers remain responsible for review and merge decisions.