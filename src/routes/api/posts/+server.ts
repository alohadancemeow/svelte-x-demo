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

        // Pagination parameters
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '5');
        const offset = (page - 1) * limit;

        console.log(`Fetching ${feedType} feed - Page: ${page}, Limit: ${limit}, Offset: ${offset}`);

        let posts: Awaited<ReturnType<typeof db.query.post.findMany>>;
        let totalCount = 0;

        if (feedType === 'following' && session?.userId) {
            // Following feed: get posts from users they follow (only for authenticated users)

            // First, get the list of users that the current user follows
            const followingUsers = await db
                .select({ followingId: follower.followingId })
                .from(follower)
                .where(eq(follower.followerId, session.userId));

            const followingUserIds = followingUsers.map(f => f.followingId);

            if (followingUserIds.length > 0) {
                // Get total count for pagination
                const countResult = await db
                    .select({ count: post.id })
                    .from(post)
                    .where(inArray(post.authorId, followingUserIds));
                totalCount = countResult.length;

                // Get posts only from users they follow with pagination
                posts = await db.query.post.findMany({
                    where: inArray(post.authorId, followingUserIds),
                    orderBy: (post, { desc }) => [desc(post.createdAt)],
                    limit: limit,
                    offset: offset,
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
                totalCount = 0;
            }
        } else {
            // All feed: get all posts (default behavior for unauthenticated users or when feedType is 'all')

            // Get total count for pagination
            const countResult = await db.select({ count: post.id }).from(post);
            totalCount = countResult.length;

            posts = await db.query.post.findMany({
                orderBy: (post, { desc }) => [desc(post.createdAt)],
                limit: limit,
                offset: offset,
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

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const nextPage = hasNextPage ? page + 1 : null;

        // console.log("Successfully parsed posts:", parsedPosts);

        return json({
            posts: parsedPosts,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages,
                hasNextPage,
                nextPage
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching posts:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};