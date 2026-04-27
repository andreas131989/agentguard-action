import {
  findExistingAgentGuardComment,
  type IssueCommentListClient
} from "./find-existing-comment.js";

export type CreateIssueCommentParams = {
  owner: string;
  repo: string;
  issue_number: number;
  body: string;
};

export type UpdateIssueCommentParams = {
  owner: string;
  repo: string;
  comment_id: number;
  body: string;
};

export type IssueCommentMutationResponse = {
  data?: {
    id?: number;
  };
};

export type IssueCommentClient = IssueCommentListClient & {
  rest: {
    issues: IssueCommentListClient["rest"]["issues"] & {
      createComment: (parameters: CreateIssueCommentParams) => Promise<IssueCommentMutationResponse>;
      updateComment: (parameters: UpdateIssueCommentParams) => Promise<IssueCommentMutationResponse>;
    };
  };
};

export type UpsertRiskCommentInput = {
  owner: string;
  repo: string;
  issueNumber: number;
  body: string;
  shouldComment: boolean;
};

export type UpsertRiskCommentResult =
  | {
      action: "skipped";
      reason: string;
    }
  | {
      action: "created";
      commentId?: number;
    }
  | {
      action: "updated";
      commentId: number;
    };

export async function upsertRiskComment(
  client: IssueCommentClient,
  input: UpsertRiskCommentInput
): Promise<UpsertRiskCommentResult> {
  if (!input.shouldComment) {
    return {
      action: "skipped",
      reason: "Risk level is below the configured comment threshold."
    };
  }

  const existingComment = await findExistingAgentGuardComment(client, {
    owner: input.owner,
    repo: input.repo,
    issueNumber: input.issueNumber
  });

  if (existingComment) {
    await client.rest.issues.updateComment({
      owner: input.owner,
      repo: input.repo,
      comment_id: existingComment.id,
      body: input.body
    });

    return {
      action: "updated",
      commentId: existingComment.id
    };
  }

  const response = await client.rest.issues.createComment({
    owner: input.owner,
    repo: input.repo,
    issue_number: input.issueNumber,
    body: input.body
  });

  const createdCommentId = response.data?.id;

  if (createdCommentId === undefined) {
    return {
      action: "created"
    };
  }

  return {
    action: "created",
    commentId: createdCommentId
  };
}
