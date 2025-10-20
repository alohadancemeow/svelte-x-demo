<script lang="ts">
  import {
    HeartIcon,
    Loader2Icon,
    MoreHorizontal,
    XIcon,
  } from "@lucide/svelte";
  import { formatDistanceToNow } from "date-fns";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import CommentForm from "$lib/components/comments/CommentForm.svelte";
  import { cn } from "$lib/utils";
  import { authClient } from "$lib/auth-client";
  import type { CommentWithInfo } from "$lib/zod-schemas";
  import { enhance } from "$app/forms";
  import { useQueryClient } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";
  import { goto } from "$app/navigation";

  interface ReplyItemProps {
    commentParentId: string;
    comment: CommentWithInfo;
  }

  let { comment, commentParentId }: ReplyItemProps = $props();

  const session = authClient.useSession();
  const client = useQueryClient();
  let isPending = $state(false);
  let showReplyForm = $state(false);
  let likeCommentPending = $state(false);
  const isAuthor = comment.authorId === $session?.data?.user?.id;
</script>

<div class="group relative">
  <div class="flex gap-3">
    <!-- Avatar -->
    <Avatar.Root class="h-8 w-8 shrink-0">
      <Avatar.Image src={comment.author.image} alt={comment.author.name} />
      <Avatar.Fallback class="text-xs">
        {comment.author.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()}
      </Avatar.Fallback>
    </Avatar.Root>

    <!-- Content -->
    <div class="min-w-0 flex-1">
      <!-- Header -->
      <div class="flex items-center gap-2 text-sm">
        <span class="font-medium text-foreground">{comment.author.name}</span>
        <span class="text-muted-foreground">
          {formatDistanceToNow(new Date(comment.createdAt), {
            addSuffix: true,
          })}
        </span>
        {#if isAuthor}
          <span
            class="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
          >
            Author
          </span>
        {/if}
      </div>

      <!-- Comment content -->
      <div class="mt-1 text-sm text-foreground">
        {comment.content}
      </div>

      <!-- Actions -->
      <div class="mt-2 flex items-center gap-1">
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

                // Invalidate parent comment's replies if this is a reply
                if (commentParentId) {
                  await client.invalidateQueries({
                    queryKey: ["comment-replies", commentParentId],
                  });
                }

                await update();
              } else {
                likeCommentPending = false;
                console.log(result, "likeComment error");

                // Handle different error status codes
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
            class="h-6 !pl-0 text-xs text-muted-foreground hover:text-foreground"
            disabled={likeCommentPending}
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

        <!-- Mention button -->
        <Button
          variant="ghost"
          size="sm"
          class="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          onclick={() => (showReplyForm = !showReplyForm)}
        >
          Mention
        </Button>

        <!-- More options (for author) -->
        {#if isAuthor}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button
                variant="ghost"
                size="sm"
                class="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal class="h-3 w-3" />
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

                      // Invalidate parent comment's replies if this is a reply
                      if (commentParentId) {
                        await client.invalidateQueries({
                          queryKey: ["comment-replies", commentParentId],
                        });
                      }

                      // Invalidate posts query to update comment counts
                      await client.invalidateQueries({
                        queryKey: ["posts"],
                      });

                      await update();
                    } else {
                      isPending = false;
                      console.log(result, "deleteComment error");

                      // Handle different error status codes
                      if (result?.status === 401) {
                        toast.error("Please sign in to delete comments", {
                          action: {
                            label: "Sign In",
                            onClick: () => {
                              goto("/auth/sign-in");
                            },
                          },
                        });
                      } else if (result?.status === 403) {
                        toast.error(
                          "You don't have permission to delete this comment"
                        );
                      } else if (result?.status === 404) {
                        toast.error("Comment not found");
                      } else {
                        toast.error("Failed to delete comment");
                      }
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

      <!-- Mention form -->
      {#if showReplyForm}
        <div
          class="mt-3 p-3 bg-muted/30 rounded-lg border-l-2 border-primary/30"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="text-xs text-muted-foreground mb-2">
              💬 Mentioning @{comment.author.name}
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors"
              onclick={() => (showReplyForm = false)}
              title="Cancel reply (Esc)"
            >
              <XIcon class="h-3 w-3" />
            </Button>
          </div>
          <CommentForm
            postId={comment.postId}
            parentId={commentParentId}
            mentionText={comment.author.name}
            onSuccess={() => (showReplyForm = false)}
          />
        </div>
      {/if}
    </div>
  </div>
</div>
