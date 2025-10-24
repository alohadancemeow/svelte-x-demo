import { json } from '@sveltejs/kit';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GOOGLE_GENERATIVE_AI_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

// Check if the API key is valid
if (!GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set');
}

const google = createGoogleGenerativeAI({
    apiKey: GOOGLE_GENERATIVE_AI_API_KEY,
});

// Generate post with AI
// POST /api/posts/generate
export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const session = locals.session;
        if (!session?.userId) {
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type = 'post' }: { type: 'post' | 'comment' } = await request.json();

        // Create prompt based on content type and user input
        let aiPrompt: string;
        if (type === 'post') {
            aiPrompt = 'Write an engaging social media post about a random interesting topic. Keep it around 50 words, make it conversational and engaging.';
        } else {
            aiPrompt = 'Write a thoughtful and engaging comment that adds value to a conversation. Keep it around 20 words, make it conversational and relevant.';
        }

        // Generate streaming post content using AI
        const result = streamText({
            model: google('gemini-2.0-flash-exp'),
            prompt: aiPrompt
        });

        // Return the streaming response
        return new Response(result.toTextStreamResponse().body, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Error generating post:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};