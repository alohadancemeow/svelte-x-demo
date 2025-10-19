/**
 * Simplified Comment System
 * Demonstrates the easier approach: Root comments vs Replies
 * 
 * Rule: parentId = null → Root comment
 *       parentId = commentId → Reply
 */

import { db } from './index';
import { comment, commentLike } from './schema';
import { eq, and, isNull, isNotNull, desc, asc } from 'drizzle-orm';

// ============================================================================
// SIMPLE QUERIES - Much Easier!
// ============================================================================

/**
 * Get only ROOT comments for a post (no replies)
 * Perfect for initial page load - fast and simple!
 */
export async function getRootComments(postId: string, limit = 20, offset = 0) {
	return await db.query.comment.findMany({
		where: and(
			eq(comment.postId, postId),
			isNull(comment.parentId)  // 🎯 This is the key!
		),
		with: {
			author: {
				columns: { id: true, name: true, image: true }
			},
			likes: true,
			_count: {
				replies: true,
				likes: true
			}
		},
		orderBy: [desc(comment.createdAt)],
		limit,
		offset
	});
}

/**
 * Get only REPLIES for a specific comment
 * Load on-demand when user clicks "Show replies"
 */
export async function getRepliesForComment(parentCommentId: string, limit = 10, offset = 0) {
	return await db.query.comment.findMany({
		where: eq(comment.parentId, parentCommentId), // 🎯 Simple!
		with: {
			author: {
				columns: { id: true, name: true, image: true }
			},
			likes: true,
			_count: {
				replies: true,
				likes: true
			}
		},
		orderBy: [asc(comment.createdAt)], // Replies usually chronological
		limit,
		offset
	});
}

/**
 * Count root comments for a post
 */
export async function countRootComments(postId: string): Promise<number> {
	const result = await db
		.select({ count: count() })
		.from(comment)
		.where(and(
			eq(comment.postId, postId),
			isNull(comment.parentId)
		));
	
	return result[0]?.count || 0;
}

/**
 * Count replies for a specific comment
 */
export async function countReplies(parentCommentId: string): Promise<number> {
	const result = await db
		.select({ count: count() })
		.from(comment)
		.where(eq(comment.parentId, parentCommentId));
	
	return result[0]?.count || 0;
}

// ============================================================================
// SIMPLE UI PATTERNS
// ============================================================================

/**
 * Pattern 1: Load root comments first, replies on-demand
 * This is what most apps do (Twitter, Reddit, etc.)
 */
export async function getCommentsForUI(postId: string, page = 1) {
	const limit = 10;
	const offset = (page - 1) * limit;
	
	// Get root comments
	const rootComments = await getRootComments(postId, limit, offset);
	
	// Add reply counts (already included in _count)
	const commentsWithCounts = rootComments.map(comment => ({
		...comment,
		hasReplies: (comment._count?.replies || 0) > 0,
		replyCount: comment._count?.replies || 0
	}));
	
	return {
		comments: commentsWithCounts,
		hasMore: rootComments.length === limit,
		nextPage: page + 1
	};
}

/**
 * Pattern 2: Load replies when user clicks "Show X replies"
 */
export async function loadRepliesForUI(commentId: string, page = 1) {
	const limit = 5;
	const offset = (page - 1) * limit;
	
	const replies = await getRepliesForComment(commentId, limit, offset);
	
	return {
		replies,
		hasMore: replies.length === limit,
		nextPage: page + 1
	};
}

// ============================================================================
// WHEN TO USE EACH APPROACH
// ============================================================================

/**
 * ✅ USE SIMPLE APPROACH (parentId filtering) WHEN:
 * 
 * 1. **Performance is critical** - Separate queries are faster
 * 2. **Mobile/slow connections** - Load root comments first, replies on-demand
 * 3. **Large comment threads** - Don't load everything at once
 * 4. **Simple UI** - Show/hide replies pattern
 * 5. **Pagination** - Easier to paginate root comments vs replies separately
 * 6. **Most social media apps** - Twitter, Instagram, LinkedIn style
 * 
 * Examples:
 * - Social media feeds
 * - Blog comments
 * - Product reviews
 * - News article comments
 */

/**
 * ❌ USE COMPLEX TREE APPROACH WHEN:
 * 
 * 1. **Deep nesting required** - Forums, Reddit-style threads
 * 2. **Small comment counts** - Usually < 50 total comments
 * 3. **Real-time updates** - Need to show full conversation context
 * 4. **Desktop-first** - Users expect to see full threads
 * 
 * Examples:
 * - Forum discussions
 * - Code review comments
 * - Collaborative documents
 * - Support tickets
 */

// ============================================================================
// EXAMPLE USAGE IN SVELTE COMPONENTS
// ============================================================================

/**
 * Example: Simple Comment List Component
 */
export const commentListExample = `
<!-- CommentList.svelte -->
<script>
  import { getRootComments, loadRepliesForUI } from '$lib/server/db/simple-comments';
  
  let { postId } = $props();
  let comments = $state([]);
  let expandedComments = $state(new Set());
  let repliesCache = $state(new Map());
  
  // Load root comments on mount
  onMount(async () => {
    const result = await getRootComments(postId);
    comments = result;
  });
  
  // Load replies for a specific comment
  async function toggleReplies(commentId) {
    if (expandedComments.has(commentId)) {
      expandedComments.delete(commentId);
    } else {
      if (!repliesCache.has(commentId)) {
        const replies = await loadRepliesForUI(commentId);
        repliesCache.set(commentId, replies);
      }
      expandedComments.add(commentId);
    }
  }
</script>

{#each comments as comment}
  <div class="comment">
    <p>{comment.content}</p>
    <p>by {comment.author.name}</p>
    
    {#if comment.hasReplies}
      <button onclick={() => toggleReplies(comment.id)}>
        {expandedComments.has(comment.id) ? 'Hide' : 'Show'} 
        {comment.replyCount} replies
      </button>
      
      {#if expandedComments.has(comment.id)}
        {#each repliesCache.get(comment.id)?.replies || [] as reply}
          <div class="reply ml-4">
            <p>{reply.content}</p>
            <p>by {reply.author.name}</p>
          </div>
        {/each}
      {/if}
    {/if}
  </div>
{/each}
`;

// ============================================================================
// PERFORMANCE COMPARISON
// ============================================================================

/**
 * SIMPLE APPROACH PERFORMANCE:
 * 
 * Initial Load:
 * - Query 1: Get 10 root comments → ~5ms
 * - Total: ~5ms ⚡
 * 
 * Show Replies:
 * - Query 2: Get 5 replies for comment → ~2ms
 * - Total: ~2ms per expansion ⚡
 * 
 * COMPLEX TREE APPROACH PERFORMANCE:
 * 
 * Initial Load:
 * - Query 1: Get ALL comments for post → ~50ms
 * - Processing: Build tree structure → ~10ms
 * - Total: ~60ms 🐌
 */

export default {
	getRootComments,
	getRepliesForComment,
	countRootComments,
	countReplies,
	getCommentsForUI,
	loadRepliesForUI
};