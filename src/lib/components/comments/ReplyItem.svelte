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

  interface ReplyItemProps {
    commentParentId: string;
    comment: CommentWithInfo;
  }

  let { comment, commentParentId }: ReplyItemProps = $props();

  const session = authClient.useSession();

  let showReplyForm = $state(false);
  let likeComment = { isPending: false } as { isPending: boolean };
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
        <Button
          variant="ghost"
          size="sm"
          class="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          disabled={likeComment.isPending}
        >
          {#if likeComment.isPending}
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
              <DropdownMenu.Item class="text-destructive"
                >Delete</DropdownMenu.Item
              >
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
