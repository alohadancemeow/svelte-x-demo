import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, parent }) => {
    const { queryClient } = await parent();

    try {
        // Prefetch the data for the query
        await queryClient.prefetchQuery({
            queryKey: ['posts'],
            queryFn: async () => {
                const response = await fetch('/api/posts');
                const data = await response.json();
                return data.posts; // Extract posts array to match the query function
            },
        });

        // Also return the data for SSR
        // const response = await fetch('/api/posts');

        // if (!response.ok) {
        //     console.error('Failed to fetch posts from API:', response.status, response.statusText);
        //     return { posts: [] };
        // }

        // const data = await response.json();

        // // The API already returns { posts: PostsWithInfo[] }
        // return { posts: data.posts };

    } catch (error) {
        console.error('Error fetching posts:', error);
        return { posts: [] };
    }
};