<script lang="ts">
  import PostCard from "$lib/components/post/PostCard.svelte";
  import PostForm from "$lib/components/post/PostForm.svelte";
  import PostSkeleton from "$lib/components/post/PostSkeleton.svelte";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { cn } from "$lib/utils";
  import { authClient } from "$lib/auth-client";
  import type { PageProps } from "./$types";
  import { createQuery } from "@tanstack/svelte-query";
  import type { PostsWithInfo } from "$lib/zod-schemas";
  import { page } from "$app/state";
  import { goto } from "$app/navigation";

  // let { data }: PageProps = $props();
  const session = authClient.useSession();

  type FeedType = "following" | "all";

  // Get feedType from URL parameters, default to "all"
  const feedType = $derived(
    (page.url.searchParams.get("feedType") as FeedType) || "all"
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

  const fetchPosts = async (
    currentFeedType: FeedType
  ): Promise<PostsWithInfo> => {
    const url = new URL(endpoint, window.location.origin);
    url.searchParams.set("feedType", currentFeedType);
    const response = await fetch(url.toString()).then((res) => res.json());
    return response.posts; // Extract the posts array from the response
  };

  const postsQuery = createQuery(() => ({
    queryKey: ["posts", feedType], // Include feedType in query key for proper caching
    queryFn: () => fetchPosts(feedType),
    // refetchInterval: intervalMs,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    staleTime: 0, // Reduce stale time to ensure fresh data when switching
    // initialData: feedType === "all" ? data?.posts || [] : [], // Only use server data for 'all' feed
    enabled: true, // Ensure query is always enabled
  }));

  // Extract reactive values
  const posts = $derived(postsQuery.data);
  const error = $derived(postsQuery.error);
  const isLoading = $derived(postsQuery.isLoading);
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
      {/if}
    </div>
  </div>
</div>
