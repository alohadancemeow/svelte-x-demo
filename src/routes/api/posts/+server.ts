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

        // console.log(`Fetching ${feedType} feed - Page: ${page}, Limit: ${limit}, Offset: ${offset}`);

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
                // Get posts from followed users with privacy filtering
                // Include: public posts, followers-only posts from followed users, and user's own private posts
                const allFollowingPosts = await db.query.post.findMany({
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

                // Filter posts based on privacy settings (return true: means "include this specific post")
                /**
                 * For example:
                 * - Post 1: authorId === session.userId → return true → included
                 * - Post 2: authorId !== session.userId → continues to next condition
                 * - Post 3: authorId === session.userId → return true → included
                 * So return true only includes that specific post where the condition is met.
                 */
                const filteredPosts = allFollowingPosts.filter(p => {
                    // Always show user's own posts (including private)
                    if (p.authorId === session.userId) return true;

                    // Show public posts from followed users
                    if (p.privacy === 'public') return true;

                    // Show followers-only posts from followed users (since user follows them)
                    if (p.privacy === 'followers') return true;

                    // Hide private posts from other users
                    return false;
                });

                // Apply pagination to filtered results
                totalCount = filteredPosts.length;
                posts = filteredPosts.slice(offset, offset + limit);
            } else {
                // User doesn't follow anyone, return empty array
                posts = [];
                totalCount = 0;
            }
        } else {
            // All feed: get all posts with privacy filtering

            if (session?.userId) {
                // For authenticated users: show all posts except private posts (unless they're the author)
                const allPosts = await db.query.post.findMany({
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

                // Filter posts based on privacy settings for "all" feed
                const filteredPosts = allPosts.filter(p => {
                    // Always show user's own posts (including private)
                    if (p.authorId === session.userId) return true;

                    // Show public posts from all users
                    if (p.privacy === 'public') return true;

                    // Show followers-only posts from all users (not restricted by following relationship in "all" feed)
                    if (p.privacy === 'followers') return true;

                    // Hide private posts from other users
                    return false;
                });

                // Apply pagination to filtered results
                totalCount = filteredPosts.length;
                posts = filteredPosts.slice(offset, offset + limit);
            } else {
                // For unauthenticated users: show public and followers-only posts
                const allPosts = await db.query.post.findMany({
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

                // Filter to show public and followers-only posts (but not private)
                const filteredPosts = allPosts.filter(p => p.privacy === 'public' || p.privacy === 'followers');

                // Apply pagination to filtered results
                totalCount = filteredPosts.length;
                posts = filteredPosts.slice(offset, offset + limit);
            }
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