import { AGENTGUARD_COMMENT_MARKER } from "./constants.js";

export type IssueComment = {
  id: number;
  body?: string | null;
  user?: {
    login?: string | null;
    type?: string | null;
  } | null;
};

export type IssueCommentListClient = {
  paginate: <T>(method: unknown, parameters: Record<string, unknown>) => Promise<T[]>;
  rest: {
    issues: {
      listComments: unknown;
    };
  };
};

export type FindExistingCommentOptions = {
  owner: string;
  repo: string;
  issueNumber: number;
};

export function isAgentGuardComment(comment: IssueComment): boolean {
  return comment.body?.includes(AGENTGUARD_COMMENT_MARKER) ?? false;
}

export async function findExistingAgentGuardComment(
  client: IssueCommentListClient,
  options: FindExistingCommentOptions
): Promise<IssueComment | null> {
  const comments = await client.paginate<IssueComment>(client.rest.issues.listComments, {
    owner: options.owner,
    repo: options.repo,
    issue_number: options.issueNumber,
    per_page: 100
  });

  return comments.find(isAgentGuardComment) ?? null;
}
