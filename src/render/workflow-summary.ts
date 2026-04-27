import * as core from "@actions/core";
import type { PullRequestRuntimeContext } from "../action/context.js";
import type { RiskResult } from "../risk/types.js";

export type WorkflowSummaryInput = {
  pullRequest: PullRequestRuntimeContext;
  result: RiskResult;
  changedFileCount: number;
  maxChangedFilesAnalyzed: number;
};

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function formatFileList(files: string[] | undefined): string {
  if (!files || files.length === 0) {
    return "";
  }

  const shownFiles = files.slice(0, 8).map((file) => `\`${escapeMarkdownCell(file)}\``);
  const remaining = files.length - shownFiles.length;

  if (remaining > 0) {
    shownFiles.push(`and ${remaining} more`);
  }

  return ` — ${shownFiles.join(", ")}`;
}

export function renderSkippedWorkflowSummary(reason: string): string {
  return [
    "## AgentGuard Risk Summary",
    "",
    "AgentGuard did not run risk analysis for this event.",
    "",
    `**Reason:** ${reason}`,
    "",
    "No PR comment was posted."
  ].join("\n");
}

export function renderWarningWorkflowSummary(reason: string): string {
  return [
    "## AgentGuard Risk Summary",
    "",
    "AgentGuard did not complete risk analysis.",
    "",
    `**Warning:** ${reason}`,
    "",
    "AgentGuard failed gracefully and did not block this workflow by default.",
    "",
    "No PR comment was posted."
  ].join("\n");
}

export function renderWorkflowSummary(input: WorkflowSummaryInput): string {
  const { pullRequest, result, changedFileCount, maxChangedFilesAnalyzed } = input;
  const lines: string[] = [
    "## AgentGuard Risk Summary",
    "",
    `**Risk Level:** ${titleCase(result.riskLevel)}`,
    `**Risk Score:** ${result.riskScore}`,
    `**Pull Request:** #${pullRequest.pullNumber} ${pullRequest.title}`,
    `**Author:** ${pullRequest.authorLogin} (${pullRequest.authorType})`,
    `**Changed Files Fetched:** ${changedFileCount}`,
    `**Max Files Analyzed By Rules:** ${maxChangedFilesAnalyzed}`,
    `**PR Comment Eligible:** ${result.shouldComment ? "Yes" : "No"}`,
    "",
    "AgentGuard flags merge risk so humans can review the right changes. It does not determine whether code is correct.",
    "",
    "AgentGuard posts at most one PR comment when the result meets the configured comment threshold.",
    ""
  ];

  if (result.skipped) {
    lines.push(`**Skipped:** ${result.skipReason ?? "No skip reason provided."}`, "");
    return lines.join("\n");
  }

  if (result.signals.length > 0) {
    lines.push("### Risk signals", "", "| Severity | Signal | Details |", "| --- | --- | --- |");

    for (const signal of result.signals) {
      lines.push(
        `| ${titleCase(signal.severity)} | ${escapeMarkdownCell(signal.label)} | ${escapeMarkdownCell(
          signal.description
        )}${formatFileList(signal.files)} |`
      );
    }

    lines.push("");
  } else {
    lines.push("### Risk signals", "", "No risk signals were detected.", "");
  }

  if (result.recommendations.length > 0) {
    lines.push("### Recommended action", "");

    for (const recommendation of result.recommendations) {
      lines.push(`- ${recommendation}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

export async function writeWorkflowSummary(markdown: string): Promise<void> {
  await core.summary.addRaw(markdown).write();
}
