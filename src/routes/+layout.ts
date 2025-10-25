import { browser } from '$app/environment'
import { QueryClient } from '@tanstack/svelte-query'
import type { LayoutLoad } from './$types'
import { authClient } from '$lib/auth-client'

export const prerender = false;

export const load: LayoutLoad = async ({ }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                enabled: browser,
            },
        },
    })

    // Only get session on client side to prevent server-side fetch issues
    let sessionId = null;
    
    if (browser) {
        try {
            const session = await authClient.getSession();
            sessionId = session?.data?.session?.id || null;
        } catch (error) {
            console.warn('Failed to get session:', error);
            sessionId = null;
        }
    }

    return { queryClient, sessionId }
}