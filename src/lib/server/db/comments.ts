/**
 * Comment Database Operations
 * Handles threaded comments, replies, and comment tree operations
 */

import { db } from './index.js';
import { comment, commentLike } from './schema.js';
import { eq, and, asc } from 'drizzle-orm';

export type CommentWithAuthor = {
	id: string;
	content: string;
	authorId: string;
	postId: string;
	parentId: string | null;
	createdAt: Date;
	updatedAt: Date;
	author: {
		id: string;
		name: string;
		email: string;
		image: string | null;
	};
	likes: Array<{
		id: string;
		userId: string;
		commentId: string;
	}>;
};

/**
 * Get all comments for a post with threaded structure
 * Returns top-level comments with nested replies
 */
export async function getCommentsForPost(postId: string): Promise<CommentWithAuthor[]> {
	// First, get all comments for the post
	const allComments = await db.query.comment.findMany({
		where: eq(comment.postId, postId),
		with: {
			author: {
				columns: {
					id: true,
					name: true,
					email: true,
					image: true,
				},
			},
			likes: true,
		},
		orderBy: [asc(comment.createdAt)],
	});

	return allComments
}

/**
 * Create a new comment or reply
 */
export async function createComment(data: {
	content: string;
	authorId: string;
	postId: string;
	parentId?: string;
}): Promise<CommentWithAuthor> {
	const [newComment] = await db.insert(comment).values({
		content: data.content.trim(),
		authorId: data.authorId,
		postId: data.postId,
		parentId: data.parentId || null,
		createdAt: new Date(),
		updatedAt: new Date(),
	}).returning();

	// Fetch the complete comment with author info
	const fullComment = await db.query.comment.findFirst({
		where: eq(comment.id, newComment.id),
		with: {
			author: {
				columns: {
					id: true,
					name: true,
					email: true,
					image: true,
				},
			},
			likes: true,
		},
	});

	if (!fullComment) {
		throw new Error('Failed to create comment');
	}

	return fullComment;

}

/**
 * Create a reply to a specific comment
 * This is a convenience function that calls createComment with parentId
 */
export async function createReply(data: {
	content: string;
	authorId: string;
	postId: string;
	parentCommentId: string;
}): Promise<CommentWithAuthor> {
	// Verify the parent comment exists
	const parentComment = await db.query.comment.findFirst({
		where: eq(comment.id, data.parentCommentId),
	});

	if (!parentComment) {
		throw new Error('Parent comment not found');
	}

	if (parentComment.postId !== data.postId) {
		throw new Error('Parent comment does not belong to the specified post');
	}

	return createComment({
		content: data.content,
		authorId: data.authorId,
		postId: data.postId,
		parentId: data.parentCommentId,
	});
}

/**
 * Delete a comment and all its replies
 */
export async function deleteComment(commentId: string, userId: string): Promise<boolean> {
	// First verify the user owns the comment
	const commentToDelete = await db.query.comment.findFirst({
		where: eq(comment.id, commentId),
	});

	if (!commentToDelete || commentToDelete.authorId !== userId) {
		throw new Error('Comment not found or unauthorized');
	}

	// Get all reply IDs to delete (recursive)
	const allReplies = await getAllRepliesRecursive(commentId);
	const allCommentIds = [commentId, ...allReplies.map(r => r.id)];

	// Delete all comment likes first
	for (const id of allCommentIds) {
		await db.delete(commentLike).where(eq(commentLike.commentId, id));
	}

	// Delete all comments (parent and replies)
	for (const id of allCommentIds) {
		await db.delete(comment).where(eq(comment.id, id));
	}

	return true;
}

/**
 * Toggle like on a comment (like if not liked, unlike if already liked)
 */
export async function toggleCommentLike(commentId: string, userId: string) {
	// Check if user already liked this comment
	const existingLike = await db.query.commentLike.findFirst({
		where: and(
			eq(commentLike.commentId, commentId),
			eq(commentLike.userId, userId)
		),
	});

	if (existingLike) {
		// Unlike: remove the like
		await db.delete(commentLike).where(
			and(
				eq(commentLike.commentId, commentId),
				eq(commentLike.userId, userId)
			)
		);
		return { action: 'unliked', liked: false };
	} else {
		// Like: add a new like
		await db.insert(commentLike).values({
			id: crypto.randomUUID(),
			commentId,
			userId,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		return { action: 'liked', liked: true };
	}
}

/**
 * Helper function to get all replies recursively
 */
async function getAllRepliesRecursive(commentId: string): Promise<any[]> {
	const directReplies = await db.query.comment.findMany({
		where: eq(comment.parentId, commentId),
	});

	let allReplies = [...directReplies];

	for (const reply of directReplies) {
		const nestedReplies = await getAllRepliesRecursive(reply.id);
		allReplies = [...allReplies, ...nestedReplies];
	}

	return allReplies;
}