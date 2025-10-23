import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, parent, url }) => {
    const { queryClient } = await parent();

    // Get feedType from URL parameters, default to "all"
    const feedType = (url.searchParams.get("feedType") as "following" | "all") || "all";

    try {
        // Prefetch the data for the query with the current feedType
        await queryClient.prefetchQuery({
            queryKey: ['posts', feedType],
            queryFn: async () => {
                const apiUrl = new URL('/api/posts', url.origin);
                apiUrl.searchParams.set('feedType', feedType);
                const response = await fetch(apiUrl.toString());
                const data = await response.json();
                return data.posts; // Extract posts array to match the query function
            },
        });

        return { feedType };

    } catch (error) {
        console.error('Error fetching posts:', error);
        return { feedType };
    }
};