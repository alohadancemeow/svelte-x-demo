import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { follower, post } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { postsWithInfoSchema } from '$lib/zod-schemas';

export const GET: RequestHandler = async ({ locals, url }) => {
    try {
        const session = locals.session;
        const feedType = url.searchParams.get('feedType') || 'all'; // Default to 'all'
        let posts: Awaited<ReturnType<typeof db.query.post.findMany>>;

        if (feedType === 'following' && session?.userId) {
            // Following feed: get posts from users they follow (only for authenticated users)

            // First, get the list of users that the current user follows
            const followingUsers = await db
                .select({ followingId: follower.followingId })
                .from(follower)
                .where(eq(follower.followerId, session.userId));

            const followingUserIds = followingUsers.map(f => f.followingId);

            if (followingUserIds.length > 0) {
                // Get posts only from users they follow
                posts = await db.query.post.findMany({
                    where: inArray(post.authorId, followingUserIds),
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
            } else {
                // User doesn't follow anyone, return empty array
                posts = [];
            }
        } else {
            // All feed: get all posts (default behavior for unauthenticated users or when feedType is 'all')
            posts = await db.query.post.findMany({
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
        }

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