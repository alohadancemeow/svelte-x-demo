<script lang="ts">
  import {
    Globe2Icon,
    HeartIcon,
    LockIcon,
    MessageCircleIcon,
    MoreHorizontal,
    SmileIcon,
    Users2Icon,
  } from "@lucide/svelte";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import { formatDistanceToNow } from "date-fns";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { cn } from "$lib/utils";
  import { toast } from "svelte-sonner";
  import CommentForm from "$lib/components/comments/CommentForm.svelte";
  import CommentList from "$lib/components/comments/CommentList.svelte";
  import type { PostWithInfo } from "$lib/zod-schemas";
  import { authClient } from "$lib/auth-client";
  import { createMutation, useQueryClient } from "@tanstack/svelte-query";
  import { goto } from "$app/navigation";
  import { enhance } from "$app/forms";

  type PostCardProps = {
    post: PostWithInfo;
  };

  let { post }: PostCardProps = $props();
  const session = authClient.useSession();
  const client = useQueryClient();

  let showComments = $state(false);
  let isImageExpanded = $state(false);
  let showDeleteConfirm = $state(false);
  const isAuthor = $derived($session?.data?.user.id === post.authorId);

  const endpoint = `/api/posts/${post.id}/like`;

  const likeMutation = createMutation(() => ({
    mutationFn: async () => {
      const response = await fetch(endpoint, { method: "POST" });

      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
        // Add status code to error for specific handling
        (error as any).status = response.status;
        throw error;
      }

      const data = await response.json();
      return data;
    },
    onMutate: async (variables: { postId: string }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await client.cancelQueries({ queryKey: ["posts"] });

      // Snapshot the previous value
      const previousPosts = client.getQueryData(["posts"]);

      // Optimistically update to the new value
      if (previousPosts && $session.data?.user?.id) {
        const currentUserId = $session.data.user.id;

        if (Array.isArray(previousPosts)) {
          const updatedPosts = previousPosts.map((p: any) => {
            if (p.id === variables.postId) {
              // Check if user already liked this post
              const userHasLiked = p.likes?.some(
                (like: any) => like.userId === currentUserId
              );

              if (userHasLiked) {
                // Remove the like optimistically
                return {
                  ...p,
                  likes: p.likes.filter(
                    (like: any) => like.userId !== currentUserId
                  ),
                };
              } else {
                // Add the like optimistically
                const newLike = {
                  id: crypto.randomUUID(), // Temporary ID
                  postId: variables.postId,
                  userId: currentUserId,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                return {
                  ...p,
                  likes: [...(p.likes || []), newLike],
                };
              }
            }
            return p;
          });

          client.setQueryData(["posts"], updatedPosts);
        }
      }

      // Return a context object with the snapshotted value
      return { previousPosts };
    },
    onError: (error, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousPosts) {
        client.setQueryData(["posts"], context.previousPosts);
      }
      console.error(error);

      // Check if it's a 401 Unauthorized error
      if ((error as any).status === 401) {
        toast.error("Please sign in to interact with posts", {
          action: {
            label: "Sign In",
            onClick: () => {
              goto("/auth/sign-in");
            },
          },
        });
      } else {
        toast.error("Failed to like post");
      }
    },
    onSettled: async () => {
      // Only invalidate once, after everything is settled
      await client.invalidateQueries({ queryKey: ["posts"] });
    },
  }));

  // $inspect(likeMutation.data, "likeMutation");

  const privacyMap = {
    public: Globe2Icon,
    followers: Users2Icon,
    private: LockIcon,
  } as const;

  const PrivacyIcon =
    privacyMap[post.privacy as keyof typeof privacyMap] ?? Globe2Icon;
</script>

<div class="p-4 space-y-4">
  <div class="flex items-start gap-3">
    <a href={`/users/${post.author.id}`}>
      <Avatar.Root>
        <Avatar.Image src={post.author.image || ""} />
        <Avatar.Fallback>{post.author.name?.[0]}</Avatar.Fallback>
      </Avatar.Root>
    </a>
    <div class="flex-1 min-w-0">
      <div class="flex items-start justify-between gap-2">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <a
              href={`/users/${post.author.id}`}
              class="font-semibold hover:underline truncate"
            >
              {post.author.name}
            </a>
            <!-- Feeling -->
            {#if post.feeling}
              <div
                class="flex items-center gap-1 text-sm text-muted-foreground"
              >
                <span>is feeling</span>
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/80 font-medium text-accent-foreground"
                >
                  {post.feeling.toLowerCase()}
                  <SmileIcon class="size-4" />
                </span>
              </div>
            {:else}
              <span class="text-sm text-muted-foreground">posted</span>
            {/if}
          </div>
          <div class="flex items-center gap-1 text-sm text-muted-foreground">
            <span>{formatDistanceToNow(post.createdAt)} ago</span>
            <span>•</span>
            <div class="flex items-center gap-1">
              <PrivacyIcon class="size-4" />
              <span class="capitalize">
                {post?.privacy?.toLowerCase() || "public"}
              </span>
            </div>
          </div>
        </div>

        <!-- Author Actions -->
        {#if isAuthor}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button
                variant="ghost"
                size="icon"
                class="size-8 text-muted-foreground"
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item
                onclick={() => {
                  showDeleteConfirm = true;
                }}
              >
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        {/if}
      </div>

      <!-- Post Content -->
      <div class="mt-3 space-y-4">
        <div class="prose prose-sm dark:prose-invert max-w-none break-words">
          {@html post.content}
        </div>

        {#if post.image}
          <button
            type="button"
            aria-label={isImageExpanded ? "Collapse image" : "Expand image"}
            class={cn(
              "relative overflow-hidden rounded-lg block w-full text-left",
              isImageExpanded ? "max-h-none" : "max-h-[512px]"
            )}
            onclick={() => (isImageExpanded = !isImageExpanded)}
          >
            <img
              src={post.image}
              alt={post.author.name
                ? `Post by ${post.author.name}`
                : "Post content"}
              class={cn(
                "w-full h-auto object-cover cursor-pointer transition-transform",
                isImageExpanded ? "hover:scale-[0.99]" : "hover:scale-[1.01]"
              )}
            />
            {#if !isImageExpanded}
              <div
                class="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent"
              ></div>
            {/if}

            <img
              src={post.image}
              alt={post.author.name
                ? `Post by ${post.author.name}`
                : "Post content"}
              class={cn(
                "w-full h-auto object-cover cursor-pointer transition-transform",
                isImageExpanded ? "hover:scale-[0.99]" : "hover:scale-[1.01]"
              )}
            />
            {#if !isImageExpanded}
              <div
                class="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent"
              ></div>
            {/if}
          </button>
        {/if}
      </div>

      <!-- Post Actions -->
      <div class="flex items-center gap-2 mt-4">
        <button
          onclick={() => {
            likeMutation.mutate({ postId: post.id });
          }}
          disabled={likeMutation.isPending}
          class="group cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent hover:bg-accent/80 transition-all duration-200 hover:px-4"
        >
          <HeartIcon
            class={cn(
              "size-4 flex-shrink-0",
              likeMutation.isPending && "animate-pulse",
              post.likes?.some(
                (like: any) => like.userId === $session.data?.user?.id
              ) && "fill-current text-red-500"
            )}
          />
          <span class="text-sm font-medium">{post?.likes?.length || 0}</span>
          <span
            class="text-sm font-medium max-w-0 overflow-hidden group-hover:max-w-[4rem] transition-all duration-200 whitespace-nowrap"
          >
            {post?.likes?.some(
              (like: any) => like.userId === $session.data?.user?.id
            )
              ? "Liked"
              : "Like"}
          </span>
        </button>
        <button
          onclick={() => (showComments = !showComments)}
          class="group cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent hover:bg-accent/80 transition-all duration-200 hover:px-4"
        >
          <MessageCircleIcon class={"size-4 flex-shrink-0"} />
          <span class="text-sm font-medium">
            {post?.comments?.length || 0}
          </span>
          <span
            class="text-sm font-medium max-w-0 overflow-hidden group-hover:max-w-[5rem] transition-all duration-200 whitespace-nowrap"
          >
            {post?.comments?.length === 1 ? "Comment" : "Comments"}
          </span>
        </button>
      </div>

      {#if showComments}
        <div class="mt-4">
          <CommentForm postId={post.id} />
          <CommentList postId={post.id} />
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Delete Confirmation Dialog -->
{#if showDeleteConfirm}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-semibold mb-2">Delete Post</h3>
      <p class="text-gray-600 mb-4">
        Are you sure you want to delete this post? This action cannot be undone.
      </p>

      <div class="flex gap-3 justify-end">
        <Button variant="outline" onclick={() => (showDeleteConfirm = false)}>
          Cancel
        </Button>

        <form
          method="POST"
          action="?/deletePost"
          use:enhance={() => {
            return async ({ result, update }) => {
              if (result.type === "success") {
                toast.success("Post deleted successfully");
                showDeleteConfirm = false;
                // Invalidate posts query to refresh the list
                await client.invalidateQueries({ queryKey: ["posts"] });
              } else if (result.type === "failure") {
                console.error(result.data?.error);
                toast.error("Failed to delete post");
              }

              await update();
            };
          }}
          class="inline"
        >
          <input type="hidden" name="postId" value={post.id} />
          <Button type="submit" variant="destructive">Delete</Button>
        </form>
      </div>
    </div>
  </div>
{/if}
