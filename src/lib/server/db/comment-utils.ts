/**
 * Comment Tree Utility Functions
 * Helper functions for working with threaded comments
 */

import type { CommentWithAuthor } from './comments.js';

/**
 * Flatten a comment tree into a linear array
 * Useful for search, counting, or processing all comments
 */
export function flattenCommentTree(comments: CommentWithAuthor[]): CommentWithAuthor[] {
	const flattened: CommentWithAuthor[] = [];
	
	function traverse(commentList: CommentWithAuthor[]) {
		for (const comment of commentList) {
			flattened.push(comment);
			if (comment.replies && comment.replies.length > 0) {
				traverse(comment.replies);
			}
		}
	}
	
	traverse(comments);
	return flattened;
}

/**
 * Get the maximum depth of a comment tree
 */
export function getCommentTreeDepth(comments: CommentWithAuthor[]): number {
	let maxDepth = 0;
	
	function traverse(commentList: CommentWithAuthor[], currentDepth: number) {
		maxDepth = Math.max(maxDepth, currentDepth);
		
		for (const comment of commentList) {
			if (comment.replies && comment.replies.length > 0) {
				traverse(comment.replies, currentDepth + 1);
			}
		}
	}
	
	traverse(comments, 1);
	return maxDepth;
}

/**
 * Count total comments in a tree (including replies)
 */
export function countCommentsInTree(comments: CommentWithAuthor[]): number {
	return flattenCommentTree(comments).length;
}

/**
 * Find a specific comment in a tree by ID
 */
export function findCommentInTree(
	comments: CommentWithAuthor[], 
	commentId: string
): CommentWithAuthor | null {
	for (const comment of comments) {
		if (comment.id === commentId) {
			return comment;
		}
		
		if (comment.replies && comment.replies.length > 0) {
			const found = findCommentInTree(comment.replies, commentId);
			if (found) {
				return found;
			}
		}
	}
	
	return null;
}

/**
 * Get the path to a comment (array of parent comment IDs)
 */
export function getCommentPath(
	comments: CommentWithAuthor[], 
	targetCommentId: string,
	currentPath: string[] = []
): string[] | null {
	for (const comment of comments) {
		const newPath = [...currentPath, comment.id];
		
		if (comment.id === targetCommentId) {
			return newPath;
		}
		
		if (comment.replies && comment.replies.length > 0) {
			const found = getCommentPath(comment.replies, targetCommentId, newPath);
			if (found) {
				return found;
			}
		}
	}
	
	return null;
}

/**
 * Sort comments by different criteria
 */
export function sortComments(
	comments: CommentWithAuthor[], 
	sortBy: 'newest' | 'oldest' | 'mostLiked' | 'mostReplies',
	recursive: boolean = true
): CommentWithAuthor[] {
	const sorted = [...comments].sort((a, b) => {
		switch (sortBy) {
			case 'newest':
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			case 'oldest':
				return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			case 'mostLiked':
				return (b._count?.likes || 0) - (a._count?.likes || 0);
			case 'mostReplies':
				return (b._count?.replies || 0) - (a._count?.replies || 0);
			default:
				return 0;
		}
	});
	
	if (recursive) {
		return sorted.map(comment => ({
			...comment,
			replies: comment.replies ? sortComments(comment.replies, sortBy, true) : []
		}));
	}
	
	return sorted;
}

/**
 * Filter comments by content or author
 */
export function filterComments(
	comments: CommentWithAuthor[],
	filter: {
		content?: string;
		authorId?: string;
		authorName?: string;
		minLikes?: number;
		maxDepth?: number;
	},
	currentDepth: number = 1
): CommentWithAuthor[] {
	const filtered: CommentWithAuthor[] = [];
	
	for (const comment of comments) {
		let matches = true;
		
		// Check content filter
		if (filter.content && !comment.content.toLowerCase().includes(filter.content.toLowerCase())) {
			matches = false;
		}
		
		// Check author ID filter
		if (filter.authorId && comment.authorId !== filter.authorId) {
			matches = false;
		}
		
		// Check author name filter
		if (filter.authorName && !comment.author.name.toLowerCase().includes(filter.authorName.toLowerCase())) {
			matches = false;
		}
		
		// Check minimum likes filter
		if (filter.minLikes && (comment._count?.likes || 0) < filter.minLikes) {
			matches = false;
		}
		
		// Check max depth filter
		if (filter.maxDepth && currentDepth > filter.maxDepth) {
			matches = false;
		}
		
		if (matches) {
			const filteredComment = { ...comment };
			
			// Recursively filter replies if within depth limit
			if (comment.replies && (!filter.maxDepth || currentDepth < filter.maxDepth)) {
				filteredComment.replies = filterComments(comment.replies, filter, currentDepth + 1);
			}
			
			filtered.push(filteredComment);
		}
	}
	
	return filtered;
}

/**
 * Paginate comments at the top level
 */
export function paginateComments(
	comments: CommentWithAuthor[],
	page: number = 1,
	limit: number = 10
): {
	comments: CommentWithAuthor[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
} {
	const total = comments.length;
	const totalPages = Math.ceil(total / limit);
	const startIndex = (page - 1) * limit;
	const endIndex = startIndex + limit;
	
	return {
		comments: comments.slice(startIndex, endIndex),
		pagination: {
			page,
			limit,
			total,
			totalPages,
			hasNext: page < totalPages,
			hasPrev: page > 1,
		},
	};
}

/**
 * Convert comment tree to a format suitable for display
 * Adds display properties like indentation level, thread indicators, etc.
 */
export function formatCommentsForDisplay(
	comments: CommentWithAuthor[],
	options: {
		maxDepth?: number;
		showThreadLines?: boolean;
		collapseAfterDepth?: number;
	} = {}
): Array<CommentWithAuthor & {
	displayDepth: number;
	isCollapsed: boolean;
	hasMoreReplies: boolean;
	threadPath: string[];
}> {
	const {
		maxDepth = 10,
		showThreadLines = true,
		collapseAfterDepth = 5
	} = options;
	
	const formatted: Array<CommentWithAuthor & {
		displayDepth: number;
		isCollapsed: boolean;
		hasMoreReplies: boolean;
		threadPath: string[];
	}> = [];
	
	function traverse(
		commentList: CommentWithAuthor[],
		depth: number = 0,
		parentPath: string[] = []
	) {
		for (const comment of commentList) {
			const threadPath = [...parentPath, comment.id];
			const isCollapsed = depth >= collapseAfterDepth;
			const hasMoreReplies = (comment.replies?.length || 0) > 0 && depth >= maxDepth;
			
			formatted.push({
				...comment,
				displayDepth: depth,
				isCollapsed,
				hasMoreReplies,
				threadPath,
			});
			
			// Only traverse replies if within max depth and not collapsed
			if (comment.replies && depth < maxDepth && !isCollapsed) {
				traverse(comment.replies, depth + 1, threadPath);
			}
		}
	}
	
	traverse(comments);
	return formatted;
}

/**
 * Get comment statistics for a tree
 */
export function getCommentTreeStats(comments: CommentWithAuthor[]) {
	const flattened = flattenCommentTree(comments);
	const totalComments = flattened.length;
	const totalLikes = flattened.reduce((sum, comment) => sum + (comment._count?.likes || 0), 0);
	const maxDepth = getCommentTreeDepth(comments);
	
	// Get author statistics
	const authorStats = new Map<string, { count: number; name: string }>();
	flattened.forEach(comment => {
		const existing = authorStats.get(comment.authorId);
		if (existing) {
			existing.count++;
		} else {
			authorStats.set(comment.authorId, {
				count: 1,
				name: comment.author.name
			});
		}
	});
	
	const topAuthors = Array.from(authorStats.entries())
		.map(([id, stats]) => ({ authorId: id, ...stats }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 5);
	
	return {
		totalComments,
		totalLikes,
		maxDepth,
		topLevelComments: comments.length,
		averageLikesPerComment: totalComments > 0 ? totalLikes / totalComments : 0,
		topAuthors,
	};
}

/**
 * Validate comment tree structure
 * Useful for debugging or data integrity checks
 */
export function validateCommentTree(comments: CommentWithAuthor[]): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];
	const seenIds = new Set<string>();
	
	function validateNode(comment: CommentWithAuthor, depth: number = 0) {
		// Check for duplicate IDs
		if (seenIds.has(comment.id)) {
			errors.push(`Duplicate comment ID found: ${comment.id}`);
		}
		seenIds.add(comment.id);
		
		// Check for required fields
		if (!comment.content || comment.content.trim().length === 0) {
			errors.push(`Comment ${comment.id} has empty content`);
		}
		
		if (!comment.authorId) {
			errors.push(`Comment ${comment.id} missing authorId`);
		}
		
		if (!comment.postId) {
			errors.push(`Comment ${comment.id} missing postId`);
		}
		
		// Check for circular references (basic check)
		if (depth > 50) {
			errors.push(`Possible circular reference detected at comment ${comment.id}`);
			return;
		}
		
		// Validate replies
		if (comment.replies) {
			for (const reply of comment.replies) {
				validateNode(reply, depth + 1);
			}
		}
	}
	
	for (const comment of comments) {
		validateNode(comment);
	}
	
	return {
		isValid: errors.length === 0,
		errors,
	};
}