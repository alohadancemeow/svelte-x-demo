<script lang="ts">
    // import { useState } from "react";
    // import { useSession } from "next-auth/react";
    // import { useCreateComment } from "@/hooks/use-comments";
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import { Textarea } from "$lib/components/ui/textarea/index.js";
    import { Loader2Icon } from "@lucide/svelte";
    import type { FormEventHandler } from "svelte/elements";
    import { Button } from "$lib/components/ui/button/index.js";

    interface CommentFormProps {
        postId: string;
        parentId?: string;
        onSuccess?: () => void;
    }

    //   const [content, setContent] = useState("");
    //   const [isFocused, setIsFocused] = useState(false);

    let { postId, parentId, onSuccess }: CommentFormProps = $props();
    let content = $state("");
    let isFocused = $state(false);

    //   const { data: session } = useSession();
    //   const createComment = useCreateComment();

    let createComment = $state({
        isPending: false,
    });

    let session = $state({
        user: { name: "Mock User", image: "https://i.pravatar.cc/40?u=mock" },
    });

    const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
        // e.preventDefault();
        // if (!content.trim()) return;
        // try {
        //   await createComment.mutateAsync({
        //     postId,
        //     content: content.trim(),
        //     parentId,
        //   });
        //   setContent("");
        //   onSuccess?.();
        // } catch (error) {
        //   console.error(error);
        // }
    };
</script>

{#if !session?.user}
    <div>Please login to comment</div>
{/if}

<form onsubmit={handleSubmit} class="relative flex gap-2">
    <Avatar.Root class="size-8 flex-shrink-0">
        <Avatar.Image src="https://i.pravatar.cc/40?u=mock" />
        <Avatar.Fallback>M</Avatar.Fallback>
    </Avatar.Root>
    <div class="flex-1">
        <div
            class="overflow-hidden rounded-lg border bg-background transition-shadow focus-within:ring-2 focus-within:ring-ring"
        >
            <Textarea
                placeholder={parentId ? "Add a reply" : "Add a comment"}
                value={content}
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
                        disabled={createComment.isPending || !content.trim()}
                        class="h-8 text-xs"
                    >
                        {#if createComment.isPending}
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
