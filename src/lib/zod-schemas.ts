import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';
import * as schema from './server/db/schema';

// Server-side Zod schemas using drizzle-zod
export const selectUserSchema = createSelectSchema(schema.user);
export const selectPostSchema = createSelectSchema(schema.post);
export const selectCommentSchema = createSelectSchema(schema.comment);
export const selectLikeSchema = createSelectSchema(schema.like);
export const selectCommentLikeSchema = createSelectSchema(schema.commentLike);
export const selectFollowerSchema = createSelectSchema(schema.follower);

// TypeScript types inferred from Zod schemas
export type User = z.infer<typeof selectUserSchema>;
export type Post = z.infer<typeof selectPostSchema>;
export type Comment = z.infer<typeof selectCommentSchema>;
export type Like = z.infer<typeof selectLikeSchema>;
export type CommentLike = z.infer<typeof selectCommentLikeSchema>;
export type Follower = z.infer<typeof selectFollowerSchema>;

// Complex schema for posts with nested relations

export const commentWithInfoSchema = selectCommentSchema.extend({
    author: selectUserSchema,
    likes: z.array(selectCommentLikeSchema)
});

export const commentsWithInfoSchema = z.array(commentWithInfoSchema);

export const postWithInfoSchema = selectPostSchema.extend({
    author: selectUserSchema,
    comments: commentsWithInfoSchema,
    likes: z.array(selectLikeSchema)
});

export const postsWithInfoSchema = z.array(postWithInfoSchema);

// TypeScript type for posts with nested relations
export type PostWithInfo = z.infer<typeof postWithInfoSchema>;
export type PostsWithInfo = z.infer<typeof postsWithInfoSchema>;
export type CommentWithInfo = z.infer<typeof commentWithInfoSchema>;
export type CommentsWithInfo = z.infer<typeof commentsWithInfoSchema>;