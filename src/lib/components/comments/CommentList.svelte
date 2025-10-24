<script lang="ts">
  import { Loader2Icon } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import CommentCard from "$lib/components/comments/CommentCard.svelte";
  import type { CommentsWithInfo } from "$lib/zod-schemas";
  import { createQuery } from "@tanstack/svelte-query";

  interface CommentListProps {
    postId: string;
  }

  let { postId }: CommentListProps = $props();

  const refetch = () => {};

  const endpoint = `/api/posts/${postId}/comments`;

  const fetchRootComments = async (): Promise<CommentsWithInfo> => {
    const response = await fetch(endpoint).then((res) => res.json());
    return response.comments;
  };

  const query = createQuery(() => ({
    queryKey: ["root-comments", postId],
    queryFn: fetchRootComments,
  }));

  // Extract reactive values
  const rootComments = $derived(query.data);
  const error = $derived(query.error);
  const isLoading = $derived(query.isLoading);

  // $inspect(rootComments, "rootComments");
</script>

{#if isLoading}
  <div class="flex justify-center py-4">
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2Icon class="size-4 animate-spin" />
      <p>Loading comments...</p>
    </div>
  </div>
{:else if error}
  <div class="flex justify-center py-4">
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <p>Failed to load comments</p>
      <Button variant="outline" size="sm" onclick={() => refetch()}>
        Try again
      </Button>
    </div>
  </div>
{:else if !rootComments}
  <div class="flex justify-center py-4">
    <p class="text-sm text-muted-foreground">No comments found</p>
  </div>
{:else}
  <div>
    {#each rootComments as comment (comment.id)}
      <div>
        <CommentCard {comment} />
      </div>
    {/each}
  </div>
{/if}
