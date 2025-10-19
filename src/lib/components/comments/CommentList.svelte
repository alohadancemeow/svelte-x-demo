<script lang="ts">
  import { ChevronDownIcon, ChevronUpIcon, Loader2Icon } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import CommentCard from "$lib/components/comments/CommentCard.svelte";
  import type { PageData } from "../../../routes/$types";
  import type { CommentsWithInfo } from "$lib/zod-schemas";

  interface CommentListProps {
    comments: CommentsWithInfo;
    depth?: number;
  }

  let { comments, depth = 0 }: CommentListProps = $props();
  let showReplies = $state(false);

  const isLoading = false;
  const isError = false;
  const refetch = () => {};
  const fetchNextPage = () => {};
  const hasNextPage = false;
  const isFetchingNextPage = false;
</script>

{#if isLoading}
  <div class="flex justify-center py-4">
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2Icon class="size-4 animate-spin" />
      <p>Loading comments...</p>
    </div>
  </div>
{:else if isError}
  <div class="flex justify-center py-4">
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <p>Failed to load comments</p>
      <Button variant="outline" size="sm" onclick={() => refetch()}>
        Try again
      </Button>
    </div>
  </div>
{:else if !comments}
  <div class="flex justify-center py-4">
    <p class="text-sm text-muted-foreground">No comments found</p>
  </div>
{/if}

<div>
  {#each comments as comment (comment.id)}
    <div>
      <CommentCard {comment} />
      <!-- {#if comment._count.replies > 0}
        {#if !showReplies}
          <Button
            variant="ghost"
            size="sm"
            class="ml-[16px] h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            style="margin-left: {(depth + 1) * 16}px"
            onclick={() => (showReplies = true)}
          >
            <ChevronDownIcon class="size-4" />
            Show {comment._count.replies}
            {comment._count.replies === 1 ? "reply" : "replies"}
          </Button>
        {:else}
          <Button
            variant="ghost"
            size="sm"
            class="ml-[16px] h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            style="margin-left: {(depth + 1) * 16}px"
            onclick={() => (showReplies = false)}
          >
            <ChevronUpIcon class="mr-1.5 size-4" />
            Hide {comment._count.replies}
            {comment._count.replies === 1 ? "reply" : "replies"}
          </Button>
          <CommentList {postId} parentId={comment.id} depth={depth + 1} />
        {/if}
      {/if} -->
    </div>
  {/each}

  <!-- Show more button -->
  {#if hasNextPage}
    <div class="flex justify-center py-2">
      <Button
        variant="ghost"
        size="sm"
        onclick={() => fetchNextPage()}
        disabled={isFetchingNextPage}
        class="h-8 text-xs text-muted-foreground hover:text-foreground"
      >
        {#if isFetchingNextPage}
          <div class="flex items-center gap-2">
            <Loader2Icon class="size-4 animate-spin" />
          </div>
        {:else}
          Show more
        {/if}
      </Button>
    </div>
  {/if}
</div>
