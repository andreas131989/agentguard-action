import * as core from "@actions/core";
import * as github from "@actions/github";
import { getPullRequestRuntimeContext } from "./action/context.js";
import { createGitHubClient } from "./action/github-client.js";
import { readActionInputs } from "./action/inputs.js";
import { upsertRiskComment } from "./comments/upsert-comment.js";
import { loadAgentGuardConfig } from "./config/load-config.js";
import { applyActionInputConfigOverrides } from "./config/normalize-config.js";
import { fetchChangedFiles } from "./files/changed-files.js";
import { renderRiskComment } from "./render/risk-comment.js";
import {
  renderSkippedWorkflowSummary,
  renderWarningWorkflowSummary,
  renderWorkflowSummary,
  writeWorkflowSummary
} from "./render/workflow-summary.js";
import { evaluateRisk } from "./risk/engine.js";
import { shouldAnalyzeInput } from "./risk/rules/ai-author.js";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

async function writeWarningSummarySafely(reason: string): Promise<void> {
  try {
    await writeWorkflowSummary(renderWarningWorkflowSummary(reason));
  } catch (summaryError: unknown) {
    core.warning(`Unable to write AgentGuard workflow summary: ${errorMessage(summaryError)}`);
  }
}

async function runAgentGuard(): Promise<void> {
  const inputs = readActionInputs();
  const pullRequest = getPullRequestRuntimeContext(github.context);

  if (!pullRequest) {
    const reason = "AgentGuard currently runs only on pull_request events.";
    core.info(reason);
    await writeWorkflowSummary(renderSkippedWorkflowSummary(reason));
    return;
  }

  const loadedConfig = await loadAgentGuardConfig(inputs.configPath);
  const configOverrides: Parameters<typeof applyActionInputConfigOverrides>[1] = {};

  if (inputs.mode !== undefined) {
    configOverrides.mode = inputs.mode;
  }

  if (inputs.commentThreshold !== undefined) {
    configOverrides.commentThreshold = inputs.commentThreshold;
  }

  const config = applyActionInputConfigOverrides(loadedConfig.config, configOverrides);

  if (loadedConfig.found) {
    core.info(`Loaded AgentGuard config from ${loadedConfig.path}.`);
  } else {
    core.info(`No AgentGuard config found at ${loadedConfig.path}; using defaults.`);
  }

  if (!config.enabled) {
    const reason = "AgentGuard is disabled by configuration.";
    core.info(reason);
    await writeWorkflowSummary(renderSkippedWorkflowSummary(reason));
    return;
  }

  const metadataOnlyDecision = shouldAnalyzeInput({
    authorLogin: pullRequest.authorLogin,
    authorType: pullRequest.authorType,
    branchName: pullRequest.branchName,
    title: pullRequest.title,
    body: pullRequest.body,
    labels: pullRequest.labels,
    changedFiles: [],
    config
  });

  if (!metadataOnlyDecision.shouldAnalyze) {
    const reason = metadataOnlyDecision.skipReason;
    core.info(reason);
    await writeWorkflowSummary(renderSkippedWorkflowSummary(reason));
    return;
  }

  core.info(`AgentGuard analyzing pull request #${pullRequest.pullNumber}.`);
  core.info(`Mode: ${config.mode}. Comment threshold: ${config.commentThreshold}.`);

  const client = createGitHubClient(inputs.githubToken);

  let changedFiles;

  try {
    changedFiles = await fetchChangedFiles(client, pullRequest);
  } catch (error: unknown) {
    const reason = `Unable to fetch pull request changed files from GitHub: ${errorMessage(error)}`;
    core.warning(reason);
    await writeWarningSummarySafely(reason);
    return;
  }

  core.info(`Fetched ${changedFiles.length} changed file(s) from GitHub.`);

  const result = evaluateRisk({
    authorLogin: pullRequest.authorLogin,
    authorType: pullRequest.authorType,
    branchName: pullRequest.branchName,
    title: pullRequest.title,
    body: pullRequest.body,
    labels: pullRequest.labels,
    changedFiles,
    config
  });

  core.info(
    `AgentGuard result: ${result.riskLevel} risk, score ${result.riskScore}, ${result.signals.length} signal(s).`
  );

  if (result.skipped) {
    core.info(`Risk analysis skipped: ${result.skipReason ?? "No skip reason provided."}`);
  }

  await writeWorkflowSummary(
    renderWorkflowSummary({
      pullRequest,
      result,
      changedFileCount: changedFiles.length,
      maxChangedFilesAnalyzed: config.largePr.maxChangedFilesAnalyzed
    })
  );

  if (!result.shouldComment) {
    core.info(
      `Risk level ${result.riskLevel} is below comment threshold ${config.commentThreshold}; no PR comment posted.`
    );
    return;
  }

  try {
    const commentResult = await upsertRiskComment(client, {
      owner: pullRequest.owner,
      repo: pullRequest.repo,
      issueNumber: pullRequest.pullNumber,
      body: renderRiskComment(result),
      shouldComment: result.shouldComment
    });

    if (commentResult.action === "created") {
      core.info(
        `Created AgentGuard PR comment${commentResult.commentId ? ` #${commentResult.commentId}` : ""}.`
      );
      return;
    }

    if (commentResult.action === "updated") {
      core.info(`Updated existing AgentGuard PR comment #${commentResult.commentId}.`);
      return;
    }

    core.info(`Skipped AgentGuard PR comment: ${commentResult.reason}`);
  } catch (error: unknown) {
    core.warning(`Unable to create or update AgentGuard PR comment: ${errorMessage(error)}`);
  }
}

export async function run(): Promise<void> {
  try {
    await runAgentGuard();
  } catch (error: unknown) {
    const reason = errorMessage(error);
    core.warning(`AgentGuard failed gracefully: ${reason}`);
    await writeWarningSummarySafely(reason);
  }
}

run();