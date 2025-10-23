import { db } from '$lib/server/db';
import { user, post, follower } from '$lib/server/db/schema';
import { error, fail, type Actions } from '@sveltejs/kit';
import { eq, count, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
    const { userId } = params;

    try {
        // Load user data
        const userData = await db.query.user.findFirst({
            where: eq(user.id, userId),
        });

        if (!userData) {
            throw error(404, 'User not found');
        }

        // Load user's posts with all related data
        const userPosts = await db.query.post.findMany({
            where: eq(post.authorId, userId),
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

        // Calculate user stats
        const totalPosts = userPosts.length;
        // const totalLikes = userPosts.reduce((sum, post) => sum + post.likes.length, 0);
        // const totalComments = userPosts.reduce((sum, post) => sum + post.comments.length, 0);

        // Get followers count (users who follow this user)
        const followersResult = await db
            .select({ count: count() })
            .from(follower)
            .where(eq(follower.followingId, userId));
        const followersCount = followersResult[0]?.count || 0;

        // Get following count (users this user follows)
        const followingResult = await db
            .select({ count: count() })
            .from(follower)
            .where(eq(follower.followerId, userId));
        const followingCount = followingResult[0]?.count || 0;

        // Check if current user is following this user
        let isFollowing = false;
        if (locals.user?.id && locals.user.id !== userId) {
            const followCheck = await db.query.follower.findFirst({
                where: and(
                    eq(follower.followerId, locals.user.id),
                    eq(follower.followingId, userId)
                )
            });
            isFollowing = !!followCheck;
        }

        return {
            user: userData,
            posts: userPosts,
            stats: {
                totalPosts,
                // totalLikes,
                // totalComments,
                followersCount,
                followingCount,
            },
            currentUser: locals.user || null,
            isOwnProfile: locals.user?.id === userId,
            isFollowing,
        };
    } catch (err) {
        console.error('Error loading user profile:', err);
        if (err instanceof Error && 'status' in err) {
            throw err; // Re-throw SvelteKit errors
        }
        throw error(500, 'Failed to load user profile');
    }
};


export const actions = {
    default: async ({ request, locals }) => {
        if (!locals.session?.userId) {
            return fail(401, { error: 'You must be logged in to follow users.' });
        }

        try {
            const formData = await request.formData();
            const userId = formData.get('userId') as string;

            if (!userId) {
                return fail(400, { error: 'User ID is required.' });
            }

            // Check if user already follows this user
            const existingFollow = await db.query.follower.findFirst({
                where: and(
                    eq(follower.followerId, locals.session.userId),
                    eq(follower.followingId, userId)
                )
            });

            if (existingFollow) {
                // Unfollow the user
                await db.delete(follower).where(
                    and(
                        eq(follower.followerId, locals.session.userId),
                        eq(follower.followingId, userId)
                    )
                );
            } else {
                // Follow the user
                await db.insert(follower).values({
                    id: crypto.randomUUID(),
                    followerId: locals.session.userId,
                    followingId: userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }

            return { success: true, userId, followed: !existingFollow };

        } catch (error) {
            console.error('Error following user:', error);
            return fail(500, { error: 'Failed to follow user. Please try again.' });
        }
    },
} satisfies Actions;