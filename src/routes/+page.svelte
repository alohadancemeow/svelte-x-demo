<script lang="ts">
  import PostCard from "$lib/components/post/PostCard.svelte";
  import PostForm from "$lib/components/post/PostForm.svelte";
  import PostSkeleton from "$lib/components/post/PostSkeleton.svelte";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { cn } from "$lib/utils";
  import { authClient } from "$lib/auth-client";
  import type { PageProps } from "./$types";
  import { createInfiniteQuery } from "@tanstack/svelte-query";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { ArrowUpFromDot } from "@lucide/svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  type FeedType = "following" | "all";

  let { data }: PageProps = $props();
  const session = authClient.useSession();

  // Get feedType from URL parameters, default to "all"
  const feedType = $derived(
    (page.url.searchParams.get("feedType") as FeedType) ||
      data.feedType ||
      "all"
  );

  // Function to update URL with new feedType
  const updateFeedType = (newFeedType: FeedType) => {
    const url = new URL(page.url);
    if (newFeedType === "all") {
      url.searchParams.delete("feedType"); // Remove param for default "all"
    } else {
      url.searchParams.set("feedType", newFeedType);
    }
    goto(url.toString(), { replaceState: true, noScroll: true });
  };

  // Reset to 'all' if user logs out while on 'following' feed
  $effect(() => {
    if (!$session.data && feedType === "following") {
      updateFeedType("all");
    }
  });

  const endpoint = "/api/posts";

  const fetchPosts = async (currentFeedType: FeedType, pageParam: number) => {
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

  const postsQuery = createInfiniteQuery(() => ({
    queryKey: ["posts", feedType, "infinite"], // Dynamic key based on current feedType
    queryFn: ({ pageParam }) => fetchPosts(feedType, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.pagination) {
        return undefined;
      }

      return lastPage.pagination.hasNextPage
        ? lastPage.pagination.nextPage
        : undefined;
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  }));

  // Extract posts from infinite query
  const posts = $derived(
    postsQuery.data?.pages?.flatMap((page) => page?.posts || []) || []
  );

  // $inspect(posts);

  const error = $derived(postsQuery.error);
  const isLoading = $derived(postsQuery.isLoading);
  const isFetchingNextPage = $derived(postsQuery.isFetchingNextPage);
  const hasNextPage = $derived(postsQuery.hasNextPage);
  const fetchNextPage = postsQuery.fetchNextPage; // function to fetch next page

  // Infinite scroll implementation
  let loadMoreTrigger = $state<HTMLElement | null>(null);

  $effect(() => {
    if (!loadMoreTrigger || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        root: null,
        rootMargin: "100px", // Start loading 100px before the element comes into view
        threshold: 0.1,
      }
    );

    observer.observe(loadMoreTrigger);

    return () => {
      observer.disconnect();
    };
  });
</script>

<div class="max-w-3xl mx-auto mt-6">
  <div class="bg-background rounded-lg shadow-sm">
    <div class="">
      <!-- Post Form -->
      {#if $session.data}
        <div class="p-4">
          <PostForm />
        </div>
      {:else}
        <div class="p-4 text-center">
          <p class="text-muted-foreground mb-3">
            Unlock to share your thoughts!
          </p>
          <a
            href="/auth/sign-in"
            class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign In
          </a>
        </div>
      {/if}

      <!-- Feed Tabs -->
      {#if $session.data}
        <div class="px-4 py-3">
          <Tabs.Root value={feedType} class="w-full">
            <Tabs.List class="grid w-full grid-cols-2 h-11">
              <Tabs.Trigger
                class={cn(
                  "font-semibold text-base cursor-pointer",
                  feedType === "following" && "bg-muted"
                )}
                value="following"
                onclick={() => updateFeedType("following")}
              >
                Following
              </Tabs.Trigger>
              <Tabs.Trigger
                class={cn(
                  "font-semibold text-base cursor-pointer",
                  feedType === "all" && "bg-muted"
                )}
                value="all"
                onclick={() => updateFeedType("all")}
              >
                All
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>
        </div>
      {:else}
        <!-- For unauthenticated users, show a simple header -->
        <div class="px-4 py-3 border-b">
          <h2 class="font-semibold text-sm text-center">All Posts</h2>
        </div>
      {/if}
    </div>

    <!-- Feed Content -->
    <div>
      {#if isLoading}
        <div>
          {#each Array.from({ length: 3 }) as _, index (index)}
            <PostSkeleton />
          {/each}
        </div>
      {:else if error}
        <div class="p-4 text-center">
          <div class="text-red-600 mb-2">Error loading posts</div>
          <div class="text-sm text-muted-foreground">{error.message}</div>
          {#if error.message.includes("Unauthorized")}
            <a
              href="/auth/sign-in"
              class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 mt-3"
            >
              Sign In to View Posts
            </a>
          {/if}
        </div>
      {:else if posts && posts.length === 0}
        <div class="p-4 text-center">
          <div class="text-muted-foreground">No posts found</div>
        </div>
      {:else if posts}
        <div>
          {#each posts as post (post.id)}
            <PostCard {post} />
          {/each}
        </div>

        <!-- Infinite Scroll Trigger -->
        {#if hasNextPage}
          <div bind:this={loadMoreTrigger} class="p-4 text-center">
            {#if isFetchingNextPage}
              <div class="flex items-center justify-center">
                <span class="text-muted-foreground">Loading more posts...</span>
              </div>
            {:else}
              <div class="h-4"></div>
              <!-- Invisible trigger area -->
            {/if}
          </div>
        {:else if posts.length > 0}
          <!-- Back to Top button when no more posts -->
          <div class="p-6 text-center">
            <div class="mb-2">
              <span class="text-muted-foreground text-sm"
                >You've reached the end!</span
              >
            </div>
            <Button
              variant="outline"
              size="icon"
              onclick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              class="bg-background border-border hover:bg-muted p-2 rounded-full"
            >
              <ArrowUpFromDot class="w-4 h-4" />
            </Button>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>
