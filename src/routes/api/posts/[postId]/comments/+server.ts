import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { comment, post } from '$lib/server/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET /api/posts/:postId/comments
// Get root comments of the post
export const GET: RequestHandler = async ({ params }) => {
    try {
        const { postId } = params;

        // Check if post exists
        const existingPost = await db.query.post.findFirst({
            where: eq(post.id, postId),
        });

        if (!existingPost) {
            return json({ error: 'Post not found' }, { status: 404 });
        }

        // get comments of the post, exclude replies
        const comments = await db.query.comment.findMany({
            where: and(eq(comment.postId, postId), isNull(comment.parentId)),
            with: {
                author: true,
                likes: true,
            },
            orderBy: (comment, { desc }) => [desc(comment.createdAt)],
        });

        return json({ comments });

    } catch (error) {
        console.error('Error fetching comments:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};