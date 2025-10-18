import { browser } from '$app/environment'
import { QueryClient } from '@tanstack/svelte-query'
import type { LayoutLoad } from './$types'
import { authClient } from '$lib/auth-client'

// export const prerender = false;

export const load: LayoutLoad = async ({ }) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                enabled: browser,
            },
        },
    })

    const session = await authClient.getSession();

    return { queryClient, sessionId: session?.data?.session?.id || null }
}