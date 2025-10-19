<script lang="ts">
  import CommentForm from "$lib/components/comments/CommentForm.svelte";
  import { Button } from "$lib/components/ui/button/index.js";
  import { XIcon, ReplyIcon } from "@lucide/svelte";
  import { cn } from "$lib/utils";
  import { onMount } from "svelte";

  interface ReplyCardProps {
    postId: string;
    parentId: string;
    depth?: number;
    onCancel?: () => void;
    onSuccess?: () => void;
    authorName?: string;
  }

  let {
    postId,
    parentId,
    depth = 0,
    onCancel,
    onSuccess,
    authorName = "this comment",
  }: ReplyCardProps = $props();

  let replyCardElement: HTMLDivElement;

  const handleSuccess = () => {
    onSuccess?.();
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      handleCancel();
    }
  };

  onMount(() => {
    // Focus the reply card when it mounts
    replyCardElement?.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Add global escape key listener
    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  });
</script>

<div
  bind:this={replyCardElement}
  class={cn(
    "relative border-l-2 border-primary/30 bg-muted/30 rounded-md p-3 mt-2 transition-all duration-300 animate-in slide-in-from-top-2",
    depth > 0 && "ml-2"
  )}
>
  <!-- Reply indicator header -->
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center gap-2">
      <ReplyIcon class="w-3 h-3 text-primary" />
      <span class="text-xs text-muted-foreground font-medium">
        Replying to {authorName}
      </span>
    </div>

    {#if onCancel}
      <Button
        variant="ghost"
        size="icon"
        class="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors"
        onclick={handleCancel}
        title="Cancel reply (Esc)"
      >
        <XIcon class="h-3 w-3" />
      </Button>
    {/if}
  </div>

  <!-- Reply form -->
  <div class="space-y-3">
    <CommentForm {postId} {parentId} onSuccess={handleSuccess} />
  </div>

  <!-- Helper text -->
  <!-- <div class="mt-2 flex items-center justify-between text-xs text-muted-foreground">
    <span>
      Press <kbd class="px-1.5 py-0.5 bg-background border rounded text-xs font-mono">Esc</kbd> to cancel
    </span>
    <span class="text-primary/70">
      💡 Tip: Be respectful and constructive
    </span>
  </div> -->
</div>

<style>
  /* kbd {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
    border-color: hsl(var(--border));
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  } */

  @keyframes slide-in-from-top-2 {
    from {
      transform: translateY(-8px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .animate-in {
    animation: slide-in-from-top-2 0.2s ease-out;
  }
</style>
