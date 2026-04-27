import type { Context } from "@actions/github/lib/context.js";
import type { RiskInput } from "../risk/types.js";

export type PullRequestRuntimeContext = {
  owner: string;
  repo: string;
  pullNumber: number;
  authorLogin: string;
  authorType: RiskInput["authorType"];
  branchName: string;
  title: string;
  body: string;
  labels: string[];
};

type PayloadLabel = string | { name?: string | null };

type PullRequestPayload = {
  pull_request?: {
    number?: number;
    title?: string | null;
    body?: string | null;
    head?: {
      ref?: string | null;
    } | null;
    user?: {
      login?: string | null;
      type?: string | null;
    } | null;
    labels?: PayloadLabel[];
  } | null;
  repository?: {
    name?: string;
    owner?: {
      login?: string;
    } | null;
  } | null;
};

function payloadAsPullRequestPayload(payload: Context["payload"]): PullRequestPayload {
  return payload as PullRequestPayload;
}

export function normalizeGitHubAuthorType(type: string | null | undefined): RiskInput["authorType"] {
  const normalized = type?.toLowerCase();

  if (normalized === "bot") {
    return "bot";
  }

  if (normalized === "user") {
    return "user";
  }

  return "unknown";
}

export function normalizeLabels(labels: PayloadLabel[] | undefined): string[] {
  return (labels ?? [])
    .map((label) => {
      if (typeof label === "string") {
        return label.trim();
      }

      return label.name?.trim() ?? "";
    })
    .filter((label) => label.length > 0);
}

export function getPullRequestRuntimeContext(
  context: Pick<Context, "eventName" | "payload" | "repo">
): PullRequestRuntimeContext | null {
  if (context.eventName !== "pull_request" && context.eventName !== "pull_request_target") {
    return null;
  }

  const payload = payloadAsPullRequestPayload(context.payload);
  const pullRequest = payload.pull_request;

  if (!pullRequest?.number) {
    return null;
  }

  return {
    owner: payload.repository?.owner?.login ?? context.repo.owner,
    repo: payload.repository?.name ?? context.repo.repo,
    pullNumber: pullRequest.number,
    authorLogin: pullRequest.user?.login ?? "unknown",
    authorType: normalizeGitHubAuthorType(pullRequest.user?.type),
    branchName: pullRequest.head?.ref ?? "",
    title: pullRequest.title ?? "",
    body: pullRequest.body ?? "",
    labels: normalizeLabels(pullRequest.labels)
  };
}
