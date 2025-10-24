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
  import { goto } from "$app/navigation";
  import { toast } from "svelte-sonner";

  interface CommentCardProps {
    comment: CommentWithInfo;
  }

  let { comment }: CommentCardProps = $props();

  const session = authClient.useSession();
  const client = useQueryClient();

  let showReplyForm = $state(false);
  let showReplies = $state(false);
  let likeCommentPending = $state(false);
  let isDeleteLoading = $state(false);
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
  const isPending = $derived(query.isPending);

  // $inspect(replies, "replies");
</script>

{#if error}
  <div class="text-red-500 text-sm">
    Error loading comments: {error.message}
  </div>
{/if}

<div class="relative">
  <div
    class={cn(
      "relative space-y-2 py-2 transition-opacity flex gap-3",
      isPending && "opacity-50"
    )}
  >
    <!--Flex 0: avatar -->
    <div class="flex items-center gap-2 h-8 w-8 shrink-0">
      <a href={`/users/${comment.authorId}`}>
        <Avatar.Root>
          <Avatar.Image src={comment.author.image || ""} />
          <Avatar.Fallback>{comment.author.name?.[0]}</Avatar.Fallback>
        </Avatar.Root>
      </a>
    </div>

    <!--Flex 1: comment header, content and actions -->
    <div class="flex-1 min-w-0">
      <!-- Comment Header Info -->
      {@render header()}
      <!-- Comment Content -->
      <div class="text-sm my-2">{comment.content}</div>
      <!-- Comment Actions -->
      {@render actions()}

      <!-- Conditionally render reply form -->
      {#if showReplyForm}
        <ReplyCard
          postId={comment.postId}
          parentId={comment.id}
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
</div>

<!-- Comment Header Snippet -->
{#snippet header()}
  <div class="flex items-center gap-3 text-sm">
    <a href={`/users/${comment.authorId}`} class="hover:underline">
      <p class="text-sm font-medium">{comment.author.name}</p>
    </a>
    <span class="text-xs text-muted-foreground">
      {#if isPending}
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
              isDeleteLoading = true;

              if (!comment.id) {
                cancel();
                return;
              }

              formData.append("commentId", comment.id);

              return async ({ result, update }) => {
                if (result?.status === 200) {
                  isDeleteLoading = false;

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
                  isDeleteLoading = false;
                }
              };
            }}
          >
            <DropdownMenu.Item>
              <button
                type="submit"
                class="w-full text-left text-destructive cursor-pointer"
                disabled={isDeleteLoading}
              >
                {#if isDeleteLoading}
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
{/snippet}

<!-- Comment Actions Snippet -->
{#snippet actions()}
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
            likeCommentPending = false;
            if (result?.status === 401) {
              toast.error("Please sign in to interact with posts", {
                action: {
                  label: "Sign In",
                  onClick: () => {
                    goto("/auth/sign-in");
                  },
                },
              });
            } else if (result?.status === 404) {
              toast.error("Comment not found");
            } else {
              toast.error("Failed to like comment");
            }
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
          "h-6 text-xs text-muted-foreground hover:text-foreground !pl-0",
          comment.likes.some(
            (like) => like.userId === $session?.data?.user?.id
          ) && "text-red-500 hover:text-red-500"
        )}
        disabled={likeCommentPending || isPending}
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
    {#if !isPending}
      {#if replies && replies.length > 0}
        <Button
          variant="ghost"
          size="sm"
          class="h-6 text-xs text-muted-foreground hover:text-foreground"
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
        class="h-6 text-xs text-muted-foreground hover:text-foreground"
        onclick={() => (showReplyForm = !showReplyForm)}
      >
        Reply
      </Button>
    {/if}
  </div>
{/snippet}
