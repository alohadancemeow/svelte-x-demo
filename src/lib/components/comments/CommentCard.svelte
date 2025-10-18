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
  import CommentForm from "$lib/components/comments/CommentForm.svelte";
  import { cn } from "$lib/utils";
  import type { PageData } from "../../../routes/$types";
  import { authClient } from "$lib/auth-client";
  import { createQuery } from "@tanstack/svelte-query";

  interface CommentCardProps {
    comment: PageData["posts"][0]["comments"][0];
    depth?: number;
    maxDepth?: number;
    isPending?: boolean;
  }

  let {
    comment,
    depth = 0,
    maxDepth = 6,
    isPending = false,
  }: CommentCardProps = $props();

  const session = authClient.useSession();

  let showReplyForm = $state(false);
  let likeComment = { isPending: false } as { isPending: boolean };
  const isAuthor = comment.authorId === $session?.data?.user?.id;

  // const { data, error, isPending } = createQuery<PageData["posts"][0]>(() => ({
  //   queryKey: ["post-comment", comment.postId],
  //   // queryFn: () => likeComment(comment.postId),
  // }));

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
      isPending && "opacity-50"
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
        {#if isPending}
          <span class="flex items-center gap-1">
            <Loader2Icon class="size-4 animate-spin" />
            <span>Pending</span>
          </span>
        {:else}
          {formatDistanceToNow(new Date(comment.createdAt))} ago
        {/if}
      </span>
      {#if isAuthor && !isPending}
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
        disabled={likeComment.isPending || isPending}
      >
        <HeartIcon />
        <span>{comment.likes.length}</span>
      </Button>
      {#if depth < maxDepth && !isPending}
        <Button
          variant="ghost"
          size="sm"
          class="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          onclick={() => (showReplyForm = !showReplyForm)}
        >
          <MessageCircleIcon />
          <!-- <span>{comment.comments.length}</span> -->
          <span>Reply count</span>
        </Button>
      {/if}
    </div>

    {#if showReplyForm}
      <div class="pt-2">
        <CommentForm
          postId={comment.postId}
          parentId={comment.id}
          onSuccess={() => (showReplyForm = false)}
        />
      </div>
    {/if}
  </div>
</div>
