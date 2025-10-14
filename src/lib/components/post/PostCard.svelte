<script lang="ts">
    import {
        Globe2Icon,
        HeartIcon,
        LockIcon,
        MessageCircleIcon,
        MoreHorizontal,
        Smile,
        SmileIcon,
        Users2Icon,
    } from "@lucide/svelte";
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    import { formatDistanceToNow } from "date-fns";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { cn } from "$lib/utils";
    // import { useLikePost } from "@/hooks/use-posts";
    // import { toast } from "sonner";
    import CommentForm from "$lib/components/post/CommentForm.svelte";
    import CommentList from "$lib/components/post/CommentList.svelte";

    interface PostCardProps {
        post: {
            id: string;
            content: string;
            privacy: string;
            feeling: string | null;
            image: string | null;
            isLiked: boolean;
            createdAt: Date;
            author: {
                id: string;
                name: string | null;
                image: string | null;
            };
            _count: {
                likes: number;
                comments: number;
            };
        };
    }

    const MOCK_POST: PostCardProps["post"] = {
        id: "post_001",
        content:
            '<p>This is a <strong>mocked</strong> post content with a link to <a href="https://example.com" target="_blank">example.com</a>.</p>',
        privacy: "public",
        feeling: "Happy",
        image: null,
        isLiked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 45),
        author: {
            id: "user_123",
            name: "Jane Doe",
            image: "https://github.com/shadcn.png",
        },
        _count: {
            likes: 12,
            comments: 3,
        },
    };

    let { post = MOCK_POST }: PostCardProps = $props();

    let session = null;

    // const [showComments, setShowComments] = useState(false);
    // const [isImageExpanded, setIsImageExpanded] = useState(false);

    let showComments = $state(true);
    let isImageExpanded = $state(false);

    let likePost = { isPending: false } as { isPending: boolean };

    // const isAuthor = session?.user.id === post.author.id;
    let isAuthor = null;

    const handleLike = async () => {
        // try {
        //     await likePost.mutateAsync(post.id);
        // } catch (error) {
        //     console.error(error);
        //     toast.error("Failed to like post");
        // }
    };

    const PrivacyIcon =
        {
            public: Globe2Icon,
            followers: Users2Icon,
            private: LockIcon,
        }[post.privacy] || Globe2Icon;
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
                        {/if}
                    </div>
                    <div
                        class="flex items-center gap-1 text-sm text-muted-foreground"
                    >
                        <span>{formatDistanceToNow(post.createdAt)} ago</span>
                        <span>•</span>
                        <div class="flex items-center gap-1">
                            <PrivacyIcon class="size-4" />
                            <span class="capitalize">
                                {post.privacy.toLowerCase()}
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
                            <DropdownMenu.Item>Edit</DropdownMenu.Item>
                            <DropdownMenu.Item>Delete</DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                {/if}
            </div>

            <!-- Post Content -->
            <div class="mt-3 space-y-4">
                <div
                    class="prose prose-sm dark:prose-invert max-w-none break-words"
                >
                    {@html post.content}
                </div>

                {#if post.image}
                    <button
                        type="button"
                        aria-label={isImageExpanded
                            ? "Collapse image"
                            : "Expand image"}
                        class={cn(
                            "relative overflow-hidden rounded-lg block w-full text-left",
                            isImageExpanded ? "max-h-none" : "max-h-[512px]",
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
                                isImageExpanded
                                    ? "hover:scale-[0.99]"
                                    : "hover:scale-[1.01]",
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
                                isImageExpanded
                                    ? "hover:scale-[0.99]"
                                    : "hover:scale-[1.01]",
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
                    onclick={handleLike}
                    disabled={likePost.isPending}
                    class="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent hover:bg-accent/80 transition-all duration-200 hover:px-4"
                >
                    <HeartIcon
                        class={cn(
                            "size-4 flex-shrink-0",
                            likePost.isPending && "animate-pulse",
                            post.isLiked && "fill-current text-red-500",
                        )}
                    />
                    <span class="text-sm font-medium">{post._count.likes}</span>
                    <span
                        class="text-sm font-medium max-w-0 overflow-hidden group-hover:max-w-[4rem] transition-all duration-200 whitespace-nowrap"
                    >
                        Like
                    </span>
                </button>
                <!-- onclick={() => setShowComments(!showComments)} -->
                <button
                    class="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent hover:bg-accent/80 transition-all duration-200 hover:px-4"
                >
                    <MessageCircleIcon class={"size-4 flex-shrink-0"} />
                    <span class="text-sm font-medium">
                        {post._count.comments}
                    </span>
                    <span
                        class="text-sm font-medium max-w-0 overflow-hidden group-hover:max-w-[4rem] transition-all duration-200 hover:gap-2 hover:px-4"
                    >
                        Comment
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
