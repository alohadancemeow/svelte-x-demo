export type FeedType = "following" | "all";

const endpoint = "/api/posts";

export const fetchPosts = async (currentFeedType: FeedType, pageParam: number) => {
    try {
        const url = new URL(endpoint, window.location.origin);
        url.searchParams.set("feedType", currentFeedType);
        url.searchParams.set("page", pageParam.toString());

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching posts:", error);
        // Return a proper structure even on error to prevent undefined access
        return {
            posts: [],
            pagination: {
                hasNextPage: false,
                nextPage: null,
                currentPage: pageParam,
                totalPages: 0,
            },
        };
    }
};