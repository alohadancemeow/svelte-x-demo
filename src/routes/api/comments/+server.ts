/**
 * Comments API Routes
 * Provides REST endpoints for comment operations
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { 
	getCommentsForPost, 
	getRepliesForComment, 
	getCommentThread,
	getCommentStats 
} from '$lib/server/db/comments';
import { 
	sortComments, 
	filterComments, 
	paginateComments,
	getCommentTreeStats 
} from '$lib/server/db/comment-utils';

/**
 * GET /api/comments
 * Query parameters:
 * - postId: Get comments for a specific post
 * - commentId: Get replies for a specific comment
 * - threadId: Get a specific comment thread
 * - sort: Sort order (newest, oldest, mostLiked, mostReplies)
 * - filter: Filter by content or author
 * - page: Page number for pagination
 * - limit: Items per page
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const postId = url.searchParams.get('postId');
		const commentId = url.searchParams.get('commentId');
		const threadId = url.searchParams.get('threadId');
		const sort = url.searchParams.get('sort') as 'newest' | 'oldest' | 'mostLiked' | 'mostReplies' || 'newest';
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '10');
		const stats = url.searchParams.get('stats') === 'true';

		// Get comments for a specific post
		if (postId) {
			const comments = await getCommentsForPost(postId);
			let processedComments = sortComments(comments, sort);

			// Apply filters if provided
			const contentFilter = url.searchParams.get('content');
			const authorFilter = url.searchParams.get('author');
			const minLikes = url.searchParams.get('minLikes');

			if (contentFilter || authorFilter || minLikes) {
				processedComments = filterComments(processedComments, {
					content: contentFilter || undefined,
					authorName: authorFilter || undefined,
					minLikes: minLikes ? parseInt(minLikes) : undefined,
				});
			}

			// Paginate top-level comments
			const paginatedResult = paginateComments(processedComments, page, limit);

			const response: any = {
				comments: paginatedResult.comments,
				pagination: paginatedResult.pagination,
			};

			// Include statistics if requested
			if (stats) {
				response.stats = getCommentTreeStats(comments);
			}

			return json(response);
		}

		// Get replies for a specific comment
		if (commentId) {
			const replies = await getRepliesForComment(commentId, limit, (page - 1) * limit);
			const sortedReplies = sortComments(replies, sort, false);

			return json({
				replies: sortedReplies,
				pagination: {
					page,
					limit,
					hasMore: replies.length === limit, // Simple check
				},
			});
		}

		// Get a specific comment thread
		if (threadId) {
			const thread = await getCommentThread(threadId);
			
			if (!thread) {
				throw error(404, 'Comment thread not found');
			}

			const response: any = { thread };

			if (stats) {
				response.stats = await getCommentStats(threadId);
			}

			return json(response);
		}

		throw error(400, 'Missing required parameter: postId, commentId, or threadId');

	} catch (err) {
		console.error('Error in comments API:', err);
		
		if (err instanceof Error) {
			throw error(500, err.message);
		}
		
		throw error(500, 'Internal server error');
	}
};

/**
 * POST /api/comments
 * Create a new comment or reply
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const userId = locals.user?.id;
		if (!userId) {
			throw error(401, 'Unauthorized');
		}

		const body = await request.json();
		const { content, postId, parentId } = body;

		if (!content || !postId) {
			throw error(400, 'Missing required fields: content, postId');
		}

		// This would typically use the same logic as the form action
		// For now, redirect to use the form action approach
		throw error(405, 'Use form action instead');

	} catch (err) {
		console.error('Error creating comment:', err);
		
		if (err instanceof Error) {
			throw error(500, err.message);
		}
		
		throw error(500, 'Internal server error');
	}
};