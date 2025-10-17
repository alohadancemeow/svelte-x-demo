<script lang="ts">
  import PostCard from "$lib/components/post/PostCard.svelte";
  import PostForm from "$lib/components/post/PostForm.svelte";
  import PostSkeleton from "$lib/components/post/PostSkeleton.svelte";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { cn } from "$lib/utils";

  import { authClient } from "$lib/auth-client";
  const session = authClient.useSession();

  $inspect($session.data);

  let feedType = $state("following");

  // Mock feed state
  let isLoading = $state(false);
  let isEmpty = $state(false);

  // Mocked paginated data
  const data = {
    pages: [
      {
        items: [
          {
            id: "post_001",
            content: "<p>Exploring Svelte 5 runes — it feels super snappy!</p>",
            privacy: "public",
            feeling: "Excited",
            image:
              "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80&auto=format&fit=crop",
            isLiked: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 10),
            author: {
              id: "user_123",
              name: "Jane Doe",
              image: "https://github.com/shadcn.png",
            },
            _count: {
              likes: 12,
              comments: 3,
            },
          },
          {
            id: "post_002",
            content: "<p>Tailwind + Svelte is a pleasant combo. Any tips?</p>",
            privacy: "followers",
            feeling: "Happy",
            image: null,
            isLiked: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 45),
            author: {
              id: "user_456",
              name: "John Smith",
              image: "https://avatars.githubusercontent.com/u/9919?s=200&v=4",
            },
            _count: {
              likes: 34,
              comments: 8,
            },
          },
          {
            id: "post_003",
            content: "<p>Working on a SvelteKit demo with mock data.</p>",
            privacy: "public",
            feeling: null,
            image:
              "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80&auto=format&fit=crop",
            isLiked: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
            author: {
              id: "user_789",
              name: "Alex Kim",
              image: "https://avatars.githubusercontent.com/u/2?v=4",
            },
            _count: {
              likes: 5,
              comments: 1,
            },
          },
        ],
      },
    ],
  };

  // $inspect(feedType);
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
      {:else if isEmpty}
        <div>
          <div>No posts found</div>
        </div>
      {:else}
        <div>
          {#if data?.pages}
            {#each data?.pages as page}
              {#each page.items as post (post.id)}
                <PostCard {post} />
              {/each}
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
