import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';
import { postsWithInfoSchema } from '$lib/zod-schemas';

export const GET: RequestHandler = async ({ locals }) => {
    try {
        // const session = locals.session;

        // if (!session?.userId) {
        //     return json({ posts: [] }, { status: 200 });
        // }

        const posts = await db.query.post.findMany({
            orderBy: (post, { desc }) => [desc(post.createdAt)],
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

        const { success, data: parsedPosts, error } = postsWithInfoSchema.safeParse(posts);

        if (!success) {
            console.error("Failed to parse posts:", error);
            return json({ error: 'Internal server error' }, { status: 500 });
        }

        // console.log("Successfully parsed posts:", parsedPosts);

        return json({ posts: parsedPosts }, { status: 200 });

    } catch (error) {
        console.error('Error fetching posts:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};