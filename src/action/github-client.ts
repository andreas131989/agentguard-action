import * as github from "@actions/github";
import type { IssueCommentClient } from "../comments/upsert-comment.js";
import type { PullRequestFilesClient } from "../files/changed-files.js";

export type AgentGuardGitHubClient = PullRequestFilesClient & IssueCommentClient;

export function createGitHubClient(token: string): AgentGuardGitHubClient {
  return github.getOctokit(token) as unknown as AgentGuardGitHubClient;
}
