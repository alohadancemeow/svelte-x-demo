<script lang="ts">
  import PostForm from "$lib/components/post/PostForm.svelte";
  import * as Tabs from "$lib/components/ui/tabs/index.js";
  import { cn } from "$lib/utils";

  let feedType = $state("following");

  // $inspect(feedType);
</script>

<div class="max-w-3xl mx-auto mt-6">
  <div class="bg-background rounded-lg shadow-sm">
    <div class="">
      <!-- Post Form -->
      <div class="p-4">
        <PostForm />
      </div>

      <!-- Feed Tabs -->
      <div class="px-4 py-3">
        <Tabs.Root bind:value={feedType} class="w-full">
          <Tabs.List class="grid w-full grid-cols-2 h-11">
            <Tabs.Trigger
              class={cn(
                "font-semibold text-base cursor-pointer",
                feedType === "following" && "bg-muted",
              )}
              value="following"
            >
              Following
            </Tabs.Trigger>
            <Tabs.Trigger
              class={cn(
                "font-semibold text-base cursor-pointer",
                feedType === "all" && "bg-muted",
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
      dispaly data here...
      <!-- {isLoading ? (
            <>
              {Array.from({ length: 3 }).map((_, index) => (
                <PostSkeleton key={index} />
              ))}
            </>
          ) : isEmpty ? (
            <div>
              <div>No posts found</div>
            </div>
          ) : (
            <>
              <div>
                {data?.pages.map((page) =>
                  page.items.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                )}
              </div>
            </>
          )} -->
    </div>
  </div>
</div>
