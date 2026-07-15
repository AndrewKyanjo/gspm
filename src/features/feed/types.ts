// src/features/feed/types.ts
// Ministry Feed — tweet-style Archdiocese announcement channel with flat replies.

export type FeedPost = {
  id: string;
  parentPostId: string | null;
  authorId: string;
  authorName: string | null;
  authorRole: string | null;
  authorLevel: string | null;
  content: string;
  archdioceseId: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  replyCount: number;
};

export type FeedPostWithReplies = FeedPost & {
  replies: FeedPost[];
};

export type CreateAnnouncementInput = {
  content: string;
  archdioceseId: string;
};

export type CreateReplyInput = {
  parentPostId: string;
  content: string;
  archdioceseId: string;
};
