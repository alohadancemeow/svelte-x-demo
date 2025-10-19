<script lang="ts">
  import {
    HeartIcon,
    Loader2Icon,
    MessageCircleIcon,
    MoreHorizontal,
  } from "@lucide/svelte";
  import { formatDistanceToNow } from "date-fns";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import ReplyCard from "$lib/components/comments/ReplyCard.svelte";
  import ReplyItem from "$lib/components/comments/ReplyItem.svelte";
  import { cn } from "$lib/utils";
  import { authClient } from "$lib/auth-client";
  import { createQuery } from "@tanstack/svelte-query";
  import type { CommentWithInfo } from "$lib/zod-schemas";

  interface CommentCardProps {
    comment: CommentWithInfo;
    depth?: number;
    maxDepth?: number;
  }

  let { comment, depth = 0, maxDepth = 6 }: CommentCardProps = $props();

  const session = authClient.useSession();

  let showReplyForm = $state(false);
  let showReplies = $state(false);
  let likeComment = { isPending: false } as { isPending: boolean };
  const isAuthor = comment.authorId === $session?.data?.user?.id;

  const endpoint = `/api/comments/${comment.id}/replies`;

  const fetchReplies = async (): Promise<CommentWithInfo[]> => {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        console.error(`Failed to fetch replies: ${response.status}`);
        return [];
      }
      const data = await response.json();
      return data.replies || [];
    } catch (error) {
      console.error("Error fetching replies:", error);
      return [];
    }
  };

  const query = createQuery(() => ({
    queryKey: ["comment-replies", comment.id],
    queryFn: fetchReplies,
  }));

  // Extract reactive values
  const replies = $derived(query.data);
  const error = $derived(query.error);
  const isLoading = $derived(query.isLoading);

  // $inspect(replies, "replies");

  const handleLike = async () => {
    // try {
    //     await likeComment.mutateAsync(comment.id);
    // } catch (error) {
    //     console.error(error);
    // }
  };
</script>

<div class="relative pl-[16px]">
  {#if depth > 0}
    <div
      class="absolute bottom-0 left-0 top-0 w-[2px]"
      style="background-color: var(--border); opacity: 0.5;"
    ></div>
  {/if}

  <div
    class={cn(
      "relative space-y-2 py-2 transition-opacity",
      isLoading && "opacity-50"
    )}
  >
    <div class="flex items-center gap-2">
      <a href={`/users/${comment.authorId}`}>
        <Avatar.Root>
          <Avatar.Image src={comment.author.image || ""} />
          <Avatar.Fallback>{comment.author.name?.[0]}</Avatar.Fallback>
        </Avatar.Root>
      </a>
      <a href={`/users/${comment.author.id}`}>
        <p class="text-sm font-medium">{comment.author.name}</p>
      </a>
      <span class="text-xs text-muted-foreground">
        {#if isLoading}
          <span class="flex items-center gap-1">
            <Loader2Icon class="size-4 animate-spin" />
            <span>Pending</span>
          </span>
        {:else}
          {formatDistanceToNow(new Date(comment.createdAt))} ago
        {/if}
      </span>
      {#if isAuthor && !isLoading}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button
              variant="ghost"
              size="icon"
              class="ml-auto size-6 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal class="size-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item>Delete</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    </div>

    <div class="text-sm">{comment.content}</div>

    <div class="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        class={cn(
          "h-6 px-2 text-xs text-muted-foreground hover:text-foreground",
          comment.likes.some(
            (like) => like.userId === $session?.data?.user?.id
          ) && "text-red-500 hover:text-red-500"
        )}
        onclick={handleLike}
        disabled={likeComment.isPending || isLoading}
      >
        <HeartIcon />
        <span>{comment.likes.length}</span>
      </Button>

      {#if depth < maxDepth && !isLoading}
        {#if replies && replies.length > 0}
          <Button
            variant="ghost"
            size="sm"
            class="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            onclick={() => {
              showReplies = !showReplies;
              showReplyForm = false;
            }}
          >
            <MessageCircleIcon />
            <span>{replies.length}</span>
            <span class="ml-1">
              {showReplies ? "Hide" : "Show"} replies
            </span>
          </Button>
        {/if}

        <Button
          variant="ghost"
          size="sm"
          class="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          onclick={() => (showReplyForm = !showReplyForm)}
        >
          Reply
        </Button>
      {/if}
    </div>

    {#if showReplyForm}
      <ReplyCard
        postId={comment.postId}
        parentId={comment.id}
        {depth}
        authorName={comment.author.name}
        onCancel={() => (showReplyForm = false)}
        onSuccess={() => {
          showReplyForm = false;
          showReplies = true;
        }}
      />
    {/if}

    <!-- Display replies -->
    {#if showReplies && replies && replies.length > 0}
      <div class="mt-3 space-y-2">
        {#each replies as reply (reply.id)}
          <div class="border-l-2 border-muted pl-3">
            <ReplyItem commentParentId={comment.id} comment={reply} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
