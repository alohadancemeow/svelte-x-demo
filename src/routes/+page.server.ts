import { db } from '$lib/server/db';
import { comment } from '$lib/server/db/schema';
import { fail, type Actions } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import z from 'zod';
import type { PageServerLoad } from './$types';
import { getCommentsForPost, createComment, createReply, deleteComment, toggleCommentLike } from '$lib/server/db/comments';

export const load: PageServerLoad = async ({ locals }) => {
    // get all posts
    const posts = await db.query.post.findMany({
        orderBy: (post, { desc }) => [desc(post.createdAt)],
        with: {
            author: true,
            likes: true,
        },
    });

    // Get threaded comments for each post
    const postsWithComments = await Promise.all(
        posts.map(async (post) => {
            const comments = await getCommentsForPost(post.id);
            return {
                ...post,
                comments,
            };
        })
    );

    return { posts: postsWithComments }
}

const commentCreateSchema = z.object({
    content: z.string().min(1),
    parentId: z.string().optional(),
    postId: z.string().min(1),
});

export const actions = {
    createComment: async (event) => {
        try {
            const userId = event.locals.user?.id;
            if (!userId) {
                return fail(401, { error: 'Unauthorized' });
            }

            const formData = await event.request.formData();
            const result = commentCreateSchema.safeParse(Object.fromEntries(formData));

            if (!result.success) {
                return fail(400, {
                    error: 'Invalid comment data',
                    details: result.error.flatten()
                });
            }

            const { content, parentId, postId } = result.data;

            // Verify post exists
            const existingPost = await db.query.post.findFirst({
                where: (post, { eq }) => eq(post.id, postId),
            });

            if (!existingPost) {
                return fail(404, { error: 'Post not found' });
            }

            // Create comment or reply using the new functions
            let newComment;
            if (parentId) {
                // This is a reply to another comment
                newComment = await createReply({
                    content,
                    authorId: userId,
                    postId,
                    parentCommentId: parentId,
                });
            } else {
                // This is a top-level comment
                newComment = await createComment({
                    content,
                    authorId: userId,
                    postId,
                });
            }

            return {
                status: 201,
                comment: newComment,
                message: parentId ? 'Reply created successfully' : 'Comment created successfully'
            };

        } catch (error) {
            console.error('Error creating comment:', error);

            if (error instanceof Error) {
                return fail(400, { error: error.message });
            }

            return fail(500, { error: 'Internal server error' });
        }
    },
    deleteComment: async (event) => {
        try {
            const userId = event.locals.user?.id;
            if (!userId) {
                return fail(401, { error: 'Unauthorized' });
            }

            const formData = await event.request.formData();
            const commentId = formData.get('commentId') as string;

            if (!commentId) {
                return fail(400, { error: 'Comment ID is required' });
            }

            await deleteComment(commentId, userId);

            return {
                status: 200,
                message: 'Comment deleted successfully'
            };

        } catch (error) {
            console.error('Error deleting comment:', error);

            if (error instanceof Error) {
                return fail(400, { error: error.message });
            }

            return fail(500, { error: 'Internal server error' });
        }
    },
    likeComment: async (event) => {
        try {
            const userId = event.locals.user?.id;
            if (!userId) {
                return fail(401, { error: 'Unauthorized' });
            }

            const formData = await event.request.formData();
            const commentId = formData.get('commentId') as string;

            if (!commentId) {
                return fail(400, { error: 'Comment ID is required' });
            }

            // Verify comment exists
            const existingComment = await db.query.comment.findFirst({
                where: (comment, { eq }) => eq(comment.id, commentId),
            });

            if (!existingComment) {
                return fail(404, { error: 'Comment not found' });
            }

            const result = await toggleCommentLike(commentId, userId);

            return {
                status: 200,
                result,
                message: result.action === 'liked' ? 'Comment liked' : 'Comment unliked'
            };

        } catch (error) {
            console.error('Error toggling comment like:', error);

            if (error instanceof Error) {
                return fail(400, { error: error.message });
            }

            return fail(500, { error: 'Internal server error' });
        }
    },
    createPost: async (event) => {
        // TODO create a post
    },
    deletePost: async (event) => {
        // TODO delete a post
    },
} satisfies Actions;