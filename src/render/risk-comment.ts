import { AGENTGUARD_COMMENT_MARKER } from "../comments/constants.js";
import type { RiskLevel, RiskSignal, SignalSeverity, RiskResult } from "../risk/types.js";

const SEVERITY_RANK: Record<SignalSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

const RISK_LEVEL_EMOJI: Record<RiskLevel, string> = {
  critical: "🛑",
  high: "🔴",
  medium: "🟡",
  low: "🟢"
};

const SEVERITY_LABEL: Record<SignalSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low"
};

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeMarkdownTableCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function formatInlineCode(value: string): string {
  return `\`${value.replace(/`/g, "\\`")}\``;
}

function hasAiAuthorSignal(result: RiskResult): boolean {
  return result.signals.some((signal) => signal.id === "ai_author");
}

function sortedSignals(signals: RiskSignal[]): RiskSignal[] {
  return [...signals].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
}

function getUniqueSignalFiles(signals: RiskSignal[]): string[] {
  const files = new Set<string>();

  for (const signal of signals) {
    for (const file of signal.files ?? []) {
      files.add(file);
    }
  }

  return [...files].sort();
}

function formatFileList(files: string[], limit: number): string[] {
  const shown = files.slice(0, limit).map(formatInlineCode);
  const remaining = files.length - shown.length;

  if (remaining > 0) {
    shown.push(`_+ ${remaining} more_`);
  }

  return shown;
}

function verdictLine(result: RiskResult): string {
  const emoji = RISK_LEVEL_EMOJI[result.riskLevel];
  const level = titleCase(result.riskLevel);

  if (result.riskLevel === "critical") {
    return `> **${emoji} ${level} risk** — This PR combines high-impact review-risk signals and should receive careful human review before merge.`;
  }

  if (result.riskLevel === "high") {
    return `> **${emoji} ${level} risk** — This PR may deserve extra human attention before merge.`;
  }

  if (result.riskLevel === "medium") {
    return `> **${emoji} ${level} risk** — This PR has review-risk signals worth checking.`;
  }

  return `> **${emoji} ${level} risk** — No major review-risk signals were detected.`;
}

function renderTopRisks(signals: RiskSignal[]): string[] {
  const importantSignals = sortedSignals(signals).slice(0, 5);

  if (importantSignals.length === 0) {
    return ["- No risk signals were detected."];
  }

  return importantSignals.map((signal) => {
    const files = signal.files && signal.files.length > 0 ? ` — ${formatFileList(signal.files, 3).join(", ")}` : "";

    return `- **${signal.label}**${files}`;
  });
}

function renderRecommendations(recommendations: string[]): string[] {
  if (recommendations.length === 0) {
    return [
      "- Review the changed areas with normal human judgment.",
      "- Confirm the PR intent matches the implementation.",
      "- Ask for tests if the change affects behavior or risk-sensitive code."
    ];
  }

  return recommendations.map((recommendation) => `- ${recommendation}`);
}

function renderSignalDetails(signals: RiskSignal[]): string[] {
  if (signals.length === 0) {
    return ["No detailed risk signals were detected."];
  }

  const lines = ["| Signal | Severity | Details |", "|---|---|---|"];

  for (const signal of sortedSignals(signals)) {
    const severity = SEVERITY_LABEL[signal.severity];
    const files =
      signal.files && signal.files.length > 0
        ? `<br><br>Files: ${formatFileList(signal.files, 8).join(", ")}`
        : "";

    lines.push(
      `| ${escapeMarkdownTableCell(signal.label)} | ${severity} | ${escapeMarkdownTableCell(
        signal.description
      )}${files} |`
    );
  }

  return lines;
}

function renderRelatedFiles(files: string[]): string[] {
  if (files.length === 0) {
    return ["No specific files were attached to the detected risk signals."];
  }

  return formatFileList(files, 12).map((file) => `- ${file}`);
}

export function renderRiskComment(result: RiskResult): string {
  const levelEmoji = RISK_LEVEL_EMOJI[result.riskLevel];
  const level = titleCase(result.riskLevel);
  const signalCount = result.signals.length;
  const relatedFiles = getUniqueSignalFiles(result.signals);
  const aiWording = hasAiAuthorSignal(result)
    ? "AgentGuard detected AI/bot-related PR metadata and review-risk signals."
    : "AgentGuard detected review-risk signals in this PR.";

  const lines: string[] = [
    AGENTGUARD_COMMENT_MARKER,
    "",
    "## 🛡️ AgentGuard",
    "",
    verdictLine(result),
    "",
    "| Level | Score | Signals | Related files |",
    "|---|---:|---:|---:|",
    `| **${levelEmoji} ${level}** | **${result.riskScore}** | **${signalCount}** | **${relatedFiles.length}** |`,
    "",
    aiWording,
    "",
    "### Key review risks",
    "",
    ...renderTopRisks(result.signals),
    "",
    "### Suggested next steps",
    "",
    ...renderRecommendations(result.recommendations),
    "",
    "<details>",
    "<summary><strong>Detailed breakdown</strong></summary>",
    "",
    "#### Risk signals",
    "",
    ...renderSignalDetails(result.signals),
    "",
    "#### Related files",
    "",
    ...renderRelatedFiles(relatedFiles),
    "",
    "#### Important note",
    "",
    "AgentGuard does **not** determine whether code is correct, safe, or ready to merge.",
    "",
    "It uses deterministic file-pattern and PR-metadata signals to highlight pull requests that may deserve closer human review.",
    "",
    "</details>",
    "",
    "---",
    "_Updated automatically by AgentGuard._"
  ];

  return lines.join("\n");
}