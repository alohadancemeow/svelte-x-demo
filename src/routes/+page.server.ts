import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    return {
        posts: await db.query.post.findMany({
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
            }
        }),
    };
};