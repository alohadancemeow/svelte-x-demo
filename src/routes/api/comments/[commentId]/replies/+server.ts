import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { comment } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
    try {
        const { commentId } = params;

        // Check if comment exists
        const existingComment = await db.query.comment.findFirst({
            where: eq(comment.id, commentId),
        });

        if (!existingComment) {
            return json({ error: 'Comment not found' }, { status: 404 });
        }

        // get replies of the comment
        const replies = await db.query.comment.findMany({
            where: eq(comment.parentId, commentId),
            with: {
                author: true,
                likes: true,
            },
            orderBy: (comment, { asc }) => [asc(comment.createdAt)],
        }) ?? [];

        return json({ replies });

    } catch (error) {
        console.error('Error fetching replies:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};