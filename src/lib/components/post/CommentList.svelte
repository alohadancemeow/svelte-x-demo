<script lang="ts">
    // import { useComments } from "@/hooks/use-comments";
    import {
        ChevronDownIcon,
        ChevronUpIcon,
        Loader2Icon,
    } from "@lucide/svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import CommentCard from "$lib/components/post/CommentCard.svelte";

    interface CommentListProps {
        postId: string;
        parentId?: string;
        depth?: number;
    }

    // const [showReplies, setShowReplies] = useState(false);
    let { postId, parentId, depth = 0 }: CommentListProps = $props();
    let showReplies = $state(false);

    // Mock data for demonstration
    const data = {
        pages: [
            {
                items: [
                    {
                        id: "1",
                        content: "This is a mock comment",
                        author: { name: "Mock User" },
                        createdAt: new Date().toISOString(),
                        _count: { replies: 2 },
                    },
                    {
                        id: "2",
                        content: "Another mock comment",
                        author: { name: "Another User" },
                        createdAt: new Date().toISOString(),
                        _count: { replies: 0 },
                    },
                ],
            },
        ],
    };
    const isLoading = false;
    const isError = false;
    const refetch = () => {};
    const fetchNextPage = () => {};
    const hasNextPage = false;
    const isFetchingNextPage = false;
</script>

{#if isLoading}
    <div class="flex justify-center py-4">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon class="size-4 animate-spin" />
            <p>Loading comments...</p>
        </div>
    </div>
{:else if isError}
    <div class="flex justify-center py-4">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <p>Failed to load comments</p>
            <Button variant="outline" size="sm" onclick={() => refetch()}>
                Try again
            </Button>
        </div>
    </div>
{:else if !data?.pages[0]?.items.length}
    {#if !parentId}
        <div class="flex justify-center py-4">
            <p class="text-sm text-muted-foreground">No comments found</p>
        </div>
    {/if}
{/if}

<div>
    {#each data?.pages || [] as page, i}
        <div>
            {#each page.items as comment}
                <div>
                    <CommentCard  />
                    {#if comment._count.replies > 0}
                        {#if !showReplies}
                            <Button
                                variant="ghost"
                                size="sm"
                                class="ml-[16px] h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                style="margin-left: {(depth + 1) * 16}px"
                                onclick={() => (showReplies = true)}
                            >
                                <ChevronDownIcon class="size-4" />
                                Show {comment._count.replies}
                                {comment._count.replies === 1
                                    ? "reply"
                                    : "replies"}
                            </Button>
                        {:else}
                            <Button
                                variant="ghost"
                                size="sm"
                                class="ml-[16px] h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                style="margin-left: {(depth + 1) * 16}px"
                                onclick={() => (showReplies = false)}
                            >
                                <ChevronUpIcon class="mr-1.5 size-4" />
                                Hide {comment._count.replies}
                                {comment._count.replies === 1
                                    ? "reply"
                                    : "replies"}
                            </Button>
                            <!-- <CommentList
                                {postId}
                                parentId={comment.id}
                                depth={depth + 1}
                            /> -->
                        {/if}
                    {/if}
                </div>
            {/each}
            {#if hasNextPage}
                <div class="flex justify-center py-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        class="h-8 text-xs text-muted-foreground hover:text-foreground"
                    >
                        {#if isFetchingNextPage}
                            <div class="flex items-center gap-2">
                                <Loader2Icon class="size-4 animate-spin" />
                            </div>
                        {:else}
                            Show more
                        {/if}
                    </Button>
                </div>
            {/if}
        </div>
    {/each}
</div>
