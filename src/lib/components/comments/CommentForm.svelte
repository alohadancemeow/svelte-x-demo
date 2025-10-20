<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Loader2Icon } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import { authClient } from "$lib/auth-client";
  import { enhance } from "$app/forms";
  import { page } from "$app/state";
  import { useQueryClient } from "@tanstack/svelte-query";

  interface CommentFormProps {
    postId: string;
    parentId?: string;
    onSuccess?: () => void;
    mentionText?: string;
  }

  let { postId, parentId, onSuccess, mentionText }: CommentFormProps = $props();
  let content = $state(mentionText ? `@${mentionText} ` : "");
  let isFocused = $state(false);
  let isPending = $state(false);

  const session = authClient.useSession();
  const client = useQueryClient();

  // $inspect(content);
</script>

{#if !$session?.data?.user}
  <div>Please login to comment</div>
{/if}

{#if page.form?.error === 400}
  <p class="error">{page.form.error}</p>
{/if}

<form
  method="POST"
  action="?/createComment"
  use:enhance={({ formData, cancel }) => {
    isPending = true;

    // Validation before submission
    if (!content.trim()) {
      cancel();
      return;
    }

    formData.append("postId", postId);
    if (parentId) {
      formData.append("parentId", parentId);
    }

    return async ({ result, update }) => {
      if (result.type === "success") {
        // console.log(result, "createComment success");
        content = "";
        isFocused = false;
        isPending = false;

        // Invalidate queries to trigger real-time updates
        await client.invalidateQueries({
          queryKey: ["root-comments", postId],
        });

        // If this is a reply, also invalidate the parent comment's replies
        if (parentId) {
          await client.invalidateQueries({
            queryKey: ["comment-replies", parentId],
          });
        }

        // Invalidate posts query to update comment counts
        await client.invalidateQueries({
          queryKey: ["posts"],
        });

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }

        await update();
      } else {
        console.log(result, "createComment error");
        isPending = false;
      }
    };
  }}
  class="relative flex gap-2"
>
  <Avatar.Root class="size-8 flex-shrink-0">
    <Avatar.Image src={$session?.data?.user?.image || ""} />
    <Avatar.Fallback>{$session?.data?.user?.name?.[0]}</Avatar.Fallback>
  </Avatar.Root>
  <div class="flex-1">
    <div
      class="overflow-hidden rounded-lg border bg-background transition-shadow focus-within:ring-2 focus-within:ring-ring"
    >
      <Textarea
        name="content"
        placeholder={mentionText
          ? `Mention @${mentionText} in your comment...`
          : parentId
            ? "Add a reply"
            : "Add a comment"}
        bind:value={content}
        onfocus={() => (isFocused = true)}
        onblur={() => !content.trim() && (isFocused = false)}
        class="w-full resize-none min-h-[2.5rem] border-0 bg-transparent px-3 py-2 focus:outline-none"
      />

      <!-- Show character count and submit button when focused or content exists -->
      {#if isFocused || content}
        <div
          class="flex items-center justify-between border-t bg-muted/50 px-3 py-2"
        >
          <p class="text-xs text-muted-foreground">
            {content.length}/500 characters
          </p>
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim()}
            class="h-8 text-xs cursor-pointer"
          >
            {#if isPending}
              <Loader2Icon class="size-4 animate-spin" />
            {:else if parentId}
              Reply
            {:else}
              Comment
            {/if}
          </Button>
        </div>
      {/if}
    </div>
  </div>
</form>
