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
  import { enhance } from "$app/forms";
  import { createQuery, useQueryClient } from "@tanstack/svelte-query";
  import type { CommentWithInfo } from "$lib/zod-schemas";

  interface CommentCardProps {
    comment: CommentWithInfo;
    depth?: number;
    maxDepth?: number;
  }

  let { comment, depth = 0, maxDepth = 6 }: CommentCardProps = $props();

  const session = authClient.useSession();
  const client = useQueryClient();

  let showReplyForm = $state(false);
  let showReplies = $state(false);
  let likeCommentPending = $state(false);
  let isPending = $state(false);
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

      <!-- Author actions -->
      {#if isAuthor}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal class="size-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <form
              method="POST"
              action="?/deleteComment"
              use:enhance={({ formData, cancel }) => {
                isPending = true;

                if (!comment.id) {
                  cancel();
                  return;
                }

                formData.append("commentId", comment.id);

                return async ({ result, update }) => {
                  if (result?.status === 200) {
                    isPending = false;

                    // Invalidate root comments for the post
                    await client.invalidateQueries({
                      queryKey: ["root-comments", comment.postId],
                    });

                    // Invalidate posts query to update comment counts
                    await client.invalidateQueries({
                      queryKey: ["posts"],
                    });

                    await update();
                  } else {
                    console.log(result, "deleteComment error");
                    isPending = false;
                  }
                };
              }}
            >
              <DropdownMenu.Item>
                <button
                  type="submit"
                  class="w-full text-left text-destructive cursor-pointer"
                  disabled={isPending}
                >
                  {#if isPending}
                    Delete...
                  {:else}
                    Delete
                  {/if}
                </button>
              </DropdownMenu.Item>
            </form>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    </div>

    <div class="text-sm">{comment.content}</div>

    <div class="flex items-center gap-2">
      <!-- Like button -->
      <form
        method="POST"
        action="?/likeComment"
        use:enhance={({ formData, cancel }) => {
          likeCommentPending = true;

          if (!comment.id) {
            cancel();
            return;
          }

          formData.append("commentId", comment.id);

          return async ({ result, update }) => {
            if (result?.status === 200) {
              likeCommentPending = false;

              // Invalidate root comments for the post to update like counts
              await client.invalidateQueries({
                queryKey: ["root-comments", comment.postId],
              });

              await update();
            } else {
              console.log(result, "likeComment error");
              likeCommentPending = false;
            }
          };
        }}
        class="inline-block"
      >
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          class={cn(
            "h-6 px-2 text-xs text-muted-foreground hover:text-foreground",
            comment.likes.some(
              (like) => like.userId === $session?.data?.user?.id
            ) && "text-red-500 hover:text-red-500"
          )}
          disabled={likeCommentPending || isLoading}
        >
          {#if likeCommentPending}
            <Loader2Icon class="animate-spin" />
          {:else}
            <HeartIcon
              class={cn(
                comment.likes.some(
                  (like) => like.userId === $session?.data?.user?.id
                ) && "fill-red-500 text-red-500"
              )}
            />
          {/if}
          <span>{comment.likes.length}</span>
        </Button>
      </form>

      <!-- Reply button -->
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
