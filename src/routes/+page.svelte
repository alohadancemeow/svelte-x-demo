<script lang="ts">
  import PostCard from "$lib/components/post/PostCard.svelte";
  import PostForm from "$lib/components/post/PostForm.svelte";
  import PostSkeleton from "$lib/components/post/PostSkeleton.svelte";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { cn } from "$lib/utils";
  import { authClient } from "$lib/auth-client";
  import type { PageData, PageProps } from "./$types";
  import { createQuery } from "@tanstack/svelte-query";
  import type { PostsWithInfo } from "$lib/zod-schemas";

  let { data }: PageProps = $props();
  const session = authClient.useSession();
  let feedType = $state("following");
  let intervalMs = $state(1000);

  const endpoint = "/api/posts";

  const fetchPosts = async (): Promise<PostsWithInfo> => {
    const response = await fetch(endpoint).then((res) => res.json());
    return response.posts; // Extract the posts array from the response
  };

  const {
    data: posts,
    error,
    isLoading,
  } = createQuery(() => ({
    queryKey: ["posts"],
    queryFn: fetchPosts,
    refetchInterval: intervalMs, // Refetch every second
    // initialData: data?.posts || [], // Server load data is already in the correct format
  }));
</script>

<div class="max-w-3xl mx-auto mt-6">
  <div class="bg-background rounded-lg shadow-sm">
    <div class="">
      <!-- Post Form -->
      {#if $session.data}
        <div class="p-4">
          <PostForm />
          <!-- <button onclick={() => authClient.signOut()}>Sign Out</button> -->
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
      <div class="px-4 py-3">
        <Tabs.Root bind:value={feedType} class="w-full">
          <Tabs.List class="grid w-full grid-cols-2 h-11">
            <Tabs.Trigger
              class={cn(
                "font-semibold text-base cursor-pointer",
                feedType === "following" && "bg-muted"
              )}
              value="following"
            >
              Following
            </Tabs.Trigger>
            <Tabs.Trigger
              class={cn(
                "font-semibold text-base cursor-pointer",
                feedType === "all" && "bg-muted"
              )}
              value="all"
            >
              All
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
      </div>
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
