<script lang="ts">
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Loader2Icon } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import { authClient } from "$lib/auth-client";
  import { enhance } from "$app/forms";
  import { page } from "$app/state";
  import { useQueryClient } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";
  import { goto } from "$app/navigation";

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
        // toast.success("Comment posted successfully");

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
        isPending = false;
        console.log(result, "createComment error");

        // Handle different error status codes
        if (result?.status === 401) {
          toast.error("Please sign in to comment", {
            action: {
              label: "Sign In",
              onClick: () => {
                goto("/auth/sign-in");
              },
            },
          });
        } else if (result?.status === 400) {
          toast.error("Invalid comment content");
        } else if (result?.status === 404) {
          toast.error("Post not found");
        } else {
          toast.error("Failed to create comment");
        }
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
      class="overflow-hidden rounded-lg border bg-background transition-shadow focus-within:ring-2 focus-within:ring-ring relative"
    >
      <Textarea
        name="content"
        placeholder={!$session?.data?.user
          ? "Sign in to comment"
          : mentionText
            ? `Mention @${mentionText} in your comment...`
            : parentId
              ? "Add a reply"
              : "Add a comment"}
        bind:value={content}
        onfocus={() => (isFocused = true)}
        onblur={() => !content.trim() && (isFocused = false)}
        disabled={!$session?.data?.user}
        class="w-full resize-none min-h-[2.5rem] border-0 bg-transparent px-3 py-2 focus:outline-none {!$session
          ?.data?.user
          ? 'cursor-pointer'
          : ''}"
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
            disabled={!content.trim() || !$session?.data?.user}
            class="h-8 text-xs cursor-pointer"
          >
            {#if isPending}
              <Loader2Icon class="size-4 animate-spin" />
            {:else if !$session?.data?.user}
              Sign in to {parentId ? "reply" : "comment"}
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
