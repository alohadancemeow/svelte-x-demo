import { db } from '$lib/server/db';
import { comment, post } from '$lib/server/db/schema';
import { fail, type Actions } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import z from 'zod';
import type { PageServerLoad } from './$types';
import { getCommentsForPost, createComment, createReply, deleteComment, toggleCommentLike } from '$lib/server/db/comments';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { privacyOptions } from '$lib/components/post/data.js';

// Utility function to save uploaded image files
async function saveImageFile(file: File): Promise<string> {
    const imagesDir = join(process.cwd(), 'static', 'images');

    // Ensure the images directory exists
    if (!existsSync(imagesDir)) {
        await mkdir(imagesDir, { recursive: true });
    } else {
        console.log('Images directory already exists');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filepath = join(imagesDir, filename);

    // Convert file to buffer and save
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filepath, buffer);

    // Return the relative path for storing in database
    const relativePath = `/images/${filename}`;
    // console.log('Returning relative path:', relativePath);
    return relativePath;
}

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
    createPost: async ({ request, locals }) => {
        // Check if user is authenticated
        if (!locals.session?.userId) {
            return fail(401, { error: 'You must be signed in to create a post' });
        }

        try {
            const formData = await request.formData();
            const content = formData.get('content') as string;
            const privacy = formData.get('privacy') as string;
            const feeling = formData.get('feeling') as string;
            const imageFile = formData.get('image') as File | null;

            console.log('Form data received:', {
                content: content?.substring(0, 50),
                privacy,
                feeling,
                imageFile: imageFile ? { name: imageFile.name, size: imageFile.size, type: imageFile.type } : null
            });

            // Check if image file is properly received
            // if (imageFile) {
            //     console.log('Image file details:', {
            //         name: imageFile.name,
            //         size: imageFile.size,
            //         type: imageFile.type,
            //         constructor: imageFile.constructor.name
            //     });
            // }

            // Validate required fields
            // if (!content?.trim()) {
            //     return fail(400, { error: 'Post content is required' });
            // }

            // Validate privacy setting
            const validPrivacyValues = privacyOptions.map(option => option.value);
            if (privacy && !validPrivacyValues.includes(privacy as (typeof privacyOptions)[number]['value'])) {
                return fail(400, { error: 'Invalid privacy setting' });
            }

            // Handle image upload
            let imagePath: string | null = null;

            if (imageFile && imageFile.size > 0 && imageFile.name && imageFile.name !== '') {
                // Validate file type
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                if (!allowedTypes.includes(imageFile.type)) {
                    return fail(400, { error: 'Invalid file type. Please upload a valid image file.' });
                }

                // Validate file size (5MB limit)
                const maxSize = 5 * 1024 * 1024; // 5MB
                if (imageFile.size > maxSize) {
                    return fail(400, { error: 'File size too large. Please upload an image smaller than 5MB.' });
                }

                imagePath = await saveImageFile(imageFile);
                // console.log('Image saved successfully. Path:', imagePath);
            } else {
                console.log('No image file to process');
            }

            const newPost = await db.insert(post).values({
                content: content.trim() || '',
                privacy: privacy || 'public',
                feeling: feeling || null,
                image: imagePath,
                authorId: locals.session.userId,
                createdAt: new Date(),
                updatedAt: new Date(),
            }).returning();

            console.log('Post created successfully:', {
                id: newPost[0].id,
                image: newPost[0].image,
                privacy: newPost[0].privacy,
                feeling: newPost[0].feeling,
                authorId: newPost[0].authorId,
                content: newPost[0].content?.substring(0, 50) + '...'
            });

            return { success: true, post: newPost[0] };

        } catch (error) {
            console.error('Error creating post:', error);
            return fail(500, { error: 'Failed to create post. Please try again.' });
        }
    },
    deletePost: async ({ request, locals }) => {
        // Check authentication
        if (!locals.session?.userId) {
            return fail(401, { error: 'You must be logged in to delete posts.' });
        }

        try {
            const formData = await request.formData();
            const postId = formData.get('postId') as string;

            if (!postId) {
                return fail(400, { error: 'Post ID is required.' });
            }

            // Check if post exists and get post details
            const existingPost = await db.query.post.findFirst({
                where: eq(post.id, postId),
            });

            if (!existingPost) {
                return fail(404, { error: 'Post not found.' });
            }

            // Check if user is authorized to delete this post
            if (existingPost.authorId !== locals.session.userId) {
                return fail(403, { error: 'You are not authorized to delete this post.' });
            }

            // Delete associated image file if it exists
            if (existingPost.image) {
                try {
                    const imagePath = join(process.cwd(), 'static', existingPost.image);
                    if (existsSync(imagePath)) {
                        await unlink(imagePath);
                        console.log('Image file deleted:', existingPost.image);
                    }
                } catch (imageError) {
                    console.error('Failed to delete image file:', imageError);
                    // Continue with post deletion even if image deletion fails
                }
            }

            // Delete the post (this will cascade delete related likes and comments due to foreign key constraints)
            await db.delete(post).where(eq(post.id, postId));

            console.log('Post deleted successfully:', postId);

            return { success: true, deletedPostId: postId };

        } catch (error) {
            console.error('Error deleting post:', error);
            return fail(500, { error: 'Failed to delete post. Please try again.' });
        }
    },
} satisfies Actions;