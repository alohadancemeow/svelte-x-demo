/**
 * Comment Database Operations
 * Handles threaded comments, replies, and comment tree operations
 */

import { db } from './index.js';
import { comment, commentLike, user } from './schema.js';
import { eq, and, isNull, desc, asc } from 'drizzle-orm';

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
	replies?: CommentWithAuthor[];
	_count?: {
		replies: number;
		likes: number;
	};
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

	// Build the comment tree
	return buildCommentTree(allComments);
}

/**
 * Get replies for a specific comment
 * Useful for lazy loading or pagination of replies
 */
export async function getRepliesForComment(
	commentId: string,
	limit: number = 10,
	offset: number = 0
): Promise<CommentWithAuthor[]> {
	const replies = await db.query.comment.findMany({
		where: eq(comment.parentId, commentId),
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
		limit,
		offset,
	});

	return replies.map(reply => ({
		...reply,
		replies: [],
		_count: {
			replies: 0, // You can add a separate query to count replies if needed
			likes: reply.likes.length,
		},
	}));
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

	return {
		...fullComment,
		replies: [],
		_count: {
			replies: 0,
			likes: 0,
		},
	};
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
 * Get comment thread (comment + all its nested replies)
 * Useful for showing a specific comment thread
 */
export async function getCommentThread(commentId: string): Promise<CommentWithAuthor | null> {
	const rootComment = await db.query.comment.findFirst({
		where: eq(comment.id, commentId),
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

	if (!rootComment) {
		return null;
	}

	// Get all replies in this thread
	const allReplies = await db.query.comment.findMany({
		where: eq(comment.postId, rootComment.postId),
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

	// Filter replies that belong to this thread
	const threadReplies = allReplies.filter(reply => {
		if (reply.id === commentId) return false;
		return isInThread(reply, commentId, allReplies);
	});

	// Build the tree starting from the root comment
	const allCommentsInThread = [rootComment, ...threadReplies];
	const tree = buildCommentTree(allCommentsInThread);
	
	return tree[0] || null;
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
 * Helper function to build comment tree from flat array
 */
function buildCommentTree(comments: any[]): CommentWithAuthor[] {
	const commentMap = new Map<string, CommentWithAuthor>();
	const rootComments: CommentWithAuthor[] = [];

	// First pass: create map of all comments
	comments.forEach(comment => {
		commentMap.set(comment.id, {
			...comment,
			replies: [],
			_count: {
				replies: 0,
				likes: comment.likes?.length || 0,
			},
		});
	});

	// Second pass: build the tree
	comments.forEach(comment => {
		const commentNode = commentMap.get(comment.id)!;
		
		if (comment.parentId) {
			// This is a reply
			const parent = commentMap.get(comment.parentId);
			if (parent) {
				parent.replies!.push(commentNode);
				parent._count!.replies++;
			}
		} else {
			// This is a top-level comment
			rootComments.push(commentNode);
		}
	});

	return rootComments;
}

/**
 * Helper function to check if a comment is in a specific thread
 */
function isInThread(comment: any, rootCommentId: string, allComments: any[]): boolean {
	if (comment.parentId === rootCommentId) {
		return true;
	}
	
	if (comment.parentId) {
		const parent = allComments.find(c => c.id === comment.parentId);
		if (parent) {
			return isInThread(parent, rootCommentId, allComments);
		}
	}
	
	return false;
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

/**
 * Get comment statistics
 */
export async function getCommentStats(commentId: string) {
	const directReplies = await db.query.comment.findMany({
		where: eq(comment.parentId, commentId),
	});

	const likes = await db.query.commentLike.findMany({
		where: eq(commentLike.commentId, commentId),
	});

	return {
		replyCount: directReplies.length,
		likeCount: likes.length,
	};
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
 * Check if a user has liked a specific comment
 */
export async function hasUserLikedComment(commentId: string, userId: string): Promise<boolean> {
	const like = await db.query.commentLike.findFirst({
		where: and(
			eq(commentLike.commentId, commentId),
			eq(commentLike.userId, userId)
		),
	});
	return !!like;
}