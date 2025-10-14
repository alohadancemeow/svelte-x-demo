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
    import CommentForm from "$lib/components/post/CommentForm.svelte";
    import { cn } from "$lib/utils";

    interface CommentCardProps {
        comment: Comment;
        postId: string;
        depth?: number;
    }

    interface Comment {
        id: string;
        content: string;
        createdAt: Date;
        isLiked: boolean;
        author: {
            id: string;
            name: string | null;
            image: string | null;
        };
        _count: {
            likes: number;
            replies: number;
        };
    }

    const MOCK_COMMENT: Comment = {
        id: "comment_001",
        content: "Looks great! Loving the Svelte demo.",
        createdAt: new Date(Date.now() - 1000 * 60 * 5),
        isLiked: false,
        author: {
            id: "user_456",
            name: "John Smith",
            image: "https://avatars.githubusercontent.com/u/9919?s=200&v=4",
        },
        _count: {
            likes: 2,
            replies: 1,
        },
    };

    let {
        comment = MOCK_COMMENT,
        postId = "post_001",
        depth = 0,
        maxDepth = 6,
        isPending = false,
        isAuthor = false,
    } = $props();

    // const { data: session } = useSession();
    // let showReplyForm = false;
    // const likeComment = useLikeComment();

    let showReplyForm = $state(false);
    let likeComment = { isPending: false } as { isPending: boolean };

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
            isPending && "opacity-50",
        )}
    >
        <div class="flex items-center gap-2">
            <a href={`/users/${comment.author.id}`}>
                <Avatar.Root>
                    <Avatar.Image src={comment.author.image || ""} />
                    <Avatar.Fallback>{comment.author.name?.[0]}</Avatar.Fallback
                    >
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
                    comment.isLiked && "text-red-500 hover:text-red-500",
                )}
                onclick={handleLike}
                disabled={likeComment.isPending || isPending}
            >
                <HeartIcon />
                <span>{comment._count.likes}</span>
            </Button>
            {#if depth < maxDepth && !isPending}
                <Button
                    variant="ghost"
                    size="sm"
                    class="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onclick={() => (showReplyForm = !showReplyForm)}
                >
                    <MessageCircleIcon />
                    <span>{comment._count.replies}</span>
                </Button>
            {/if}
        </div>

        {#if showReplyForm}
            <div class="pt-2">
                <CommentForm
                    {postId}
                    parentId={comment.id}
                    onSuccess={() => (showReplyForm = false)}
                />
            </div>
        {/if}
    </div>
</div>
