import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { like, post } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
    try {
        const { postId } = params;
        const session = locals.session;

        if (!session?.userId) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user already liked this post
        const existingLike = await db.query.like.findFirst({
            where: and(
                eq(like.postId, postId),
                eq(like.userId, session.userId)
            )
        });

        if (existingLike) {
            // Unlike the post
            await db.delete(like).where(
                and(
                    eq(like.postId, postId),
                    eq(like.userId, session.userId)
                )
            );
        } else {
            // Like the post
            await db.insert(like).values({
                id: crypto.randomUUID(),
                postId,
                userId: session.userId,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        // Fetch the updated post with all its data
        const updatedPost = await db.query.post.findFirst({
            where: eq(post.id, postId),
            with: {
                author: true,
                comments: {
                    with: {
                        author: true,
                        likes: true,
                    },
                },
                likes: true,
            },
        });

        if (!updatedPost) {
            return json({ error: 'Post not found' }, { status: 404 });
        }

        return json({ post: updatedPost });
    } catch (error) {
        console.error('Error toggling like:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};