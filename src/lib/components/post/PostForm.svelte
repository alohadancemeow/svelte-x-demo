<script lang="ts">
    import {
        Globe2Icon,
        ImagePlusIcon,
        Loader2Icon,
        LockIcon,
        SendIcon,
        SmilePlusIcon,
        Users2Icon,
        XIcon,
    } from "@lucide/svelte";
    import * as Avatar from "$lib/components/ui/avatar/index.js";
    // import { useSession } from "next-auth/react";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
    // import { HiOutlineSparkles } from "react-icons/hi2";
    import { Separator } from "../ui/separator";
    import * as Select from "$lib/components/ui/select/index.js";
    // import { toast } from "sonner";
    // import { useCreatePost } from "@/hooks/use-posts";
    import PostEditor from "$lib/components/post/PostEditor.svelte";
    import Editor from "../editor/editor.svelte";

    const privacyOptions = [
        {
            value: "public",
            label: "Public",
            description: "Anyone can see your post",
            icon: Globe2Icon,
        },
        {
            value: "followers",
            label: "Followers",
            description: "Only your followers can see your post",
            icon: Users2Icon,
        },
        {
            value: "private",
            label: "Private",
            description: "Only you can see your post",
            icon: LockIcon,
        },
    ] as const;

    const feelingOptions = [
        "Happy",
        "Sad",
        "Angry",
        "Surprised",
        "Love",
        "Excited",
        "Stressed",
        "Relaxed",
        "Bored",
        "Busy",
        "Hungry",
        "Thirsty",
        "Sleepy",
        "Sick",
        "Dizzy",
        "Stoned",
        "Drunk",
        "High",
        "Stoned",
    ] as const;

    type Privacy = (typeof privacyOptions)[number]["value"];
    type Feeling = (typeof feelingOptions)[number];

    // const { data: session } = useSession();
    // const [privacy, setPrivacy] = useState<Privacy>("public");
    // const [feeling, setFeeling] = useState<Feeling | null>(null);
    // const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    // const [content, setContent] = useState<string>("");
    // const [selectedImage, setSelectedImage] = useState<File | null>(null);
    // const fileInputRef = useRef<HTMLInputElement>(null);
    // const createPost = useCreatePost();

    let privacy: Privacy = $state("public");
    let feeling: Feeling | null = $state(null);
    let previewUrl: string | null = $state(null);
    let content: string = $state("");
    let selectedImage: File | null = $state(null);

    let session = null;

    const handleImageSelect = (event: any) => {
        // const file = event.target.files?.[0];
        // if (file) {
        //     if (file.size > 10 * 1024 * 1024) {
        //         toast.error("Image size must be less than 10MB");
        //         return;
        //     }
        //     setSelectedImage(file);
        //     const url = URL.createObjectURL(file);
        //     setPreviewUrl(url);
        // }
    };

    const removeImage = () => {
        // setSelectedImage(null);
        // if (previewUrl) {
        //     URL.revokeObjectURL(previewUrl);
        //     setPreviewUrl(null);
        // }
        // if (fileInputRef.current) {
        //     fileInputRef.current.value = "";
        // }
    };

    const selectedPrivacy = privacyOptions.find(
        (option) => option.value === privacy,
    );

    const PrivacyIcon = selectedPrivacy?.icon || Globe2Icon;

    const handleSubmit = async (e: any) => {
        // e.preventDefault();
        // if (!content.trim()) return;
        // try {
        //   const formData = new FormData();
        //   formData.append("content", content.trim());
        //   formData.append("privacy", privacy);
        //   if (feeling) formData.append("feeling", feeling);
        //   if (selectedImage) formData.append("image", selectedImage);
        //   await createPost.mutateAsync(formData);
        //   setContent("");
        //   setFeeling(null);
        //   removeImage();
        // } catch (error) {
        //   console.error(error);
        // }
    };

    $inspect(content, "content");
</script>

<form class="rounded-xl border bg-card transition-shadow">
    <div class="p-4 space-y-4">
        <div class="flex gap-3">
            <Avatar.Root>
                <!-- <AvatarImage
                    src={session?.user?.image || ""}
                    alt={session?.user?.name || ""}
                />
                <AvatarFallback>{session?.user?.name?.charAt(0)}</AvatarFallback
                > -->
                <Avatar.Image
                    src="https://github.com/shadcn.png"
                    alt="@shadcn"
                />
                <Avatar.Fallback>CN</Avatar.Fallback>
            </Avatar.Root>

            <!-- Post Editor -->
            <div class="flex-1 space-y-4">
                <div>
                    <!-- <PostEditor
                        bind:content
                        placeholder="What's on your mind?"
                        minHeight="120px"
                    /> -->

                    <Editor />
                </div>
                {#if feeling !== null}
                    <div
                        class="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                        <span>Feeling</span>
                        <span class="font-medium text-foreground">
                            <!-- {feeling.toLowerCase()} -->
                            {feeling}
                        </span>
                    </div>
                {/if}
                {#if previewUrl}
                    <div class="relative">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            class="rounded-lg max-h-[512px] w-auto object-contain"
                        />
                        <Button
                            type="button"
                            variant={"ghost"}
                            size={"icon"}
                            onclick={removeImage}
                            class="absolute top-2 right-2 size-7 bg-background/50 hover:bg-background/70 transition-colors"
                        >
                            <XIcon class="size-4" />
                        </Button>
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- <div class="border-t bg-muted/40 p-3">
        <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
                <div class="flex items-center gap-0.5">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        class="hidden"
                        id="image-upload"
                        onChange={handleImageSelect}
                    />
                    <Button
                        type="button"
                        variant={"ghost"}
                        size={"icon"}
                        class="size-9"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={false}
                    >
                        <ImagePlusIcon class="size-5" />
                    </Button>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant={"ghost"}
                                size={"icon"}
                                class="size-9"
                                disabled={false}
                            >
                                <SmilePlusIcon class="size-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent class="w-64 p-2" align="start">
                            <div class="grid grid-cols-3 gap-1">
                    {feelingOptions.map((feel, index) => (
                      <Button
                        key={feel + index}
                        variant={feeling === feel ? "secondary" : "ghost"}
                        class="justify-start h-8 px-2 text-xs"
                        onClick={() =>
                          setFeeling(feeling === feel ? null : feel)
                        }
                        disabled={feeling === feel}
                        type="button"
                      >
                        {feel}
                      </Button>
                    ))}
                  </div>
                        </PopoverContent>
                    </Popover>
                    <Button
                        type="button"
                        variant={"ghost"}
                        size={"icon"}
                        class="size-9"
                        disabled={false}
                        onClick={() => {}}
                    >
                        <HiOutlineSparkles class="size-5" />
                    </Button>
                </div>
                <Separator orientation="vertical" class="h-6" />
                <Select
                    value={privacy}
                    onValueChange={(value: Privacy) => setPrivacy(value)}
                >
                    <SelectTrigger
                        class="h-9 w-auto border-none bg-transparent px-3 hover:bg-accent [&>span]:flex [&>span]:items-center [&>span]:gap-2"
                    >
                        <div class="flex items-center gap-2">
                            <PrivacyIcon class="size-4" />
                            <span class="text-sm">{selectedPrivacy?.label}</span
                            >
                        </div>
                    </SelectTrigger>
                    <SelectContent align="start" class="w-52">
                        {privacyOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    class="py-2.5"
                  >
                    <div class="flex items-start gap-2">
                      <option.icon class="size-4 mt-0.5" />
                      <div>
                        <div class="text-sm">{option.label}</div>
                        <div class="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
                    </SelectContent>
                </Select>
            </div>

            <div class="flex items-center gap-4">
                <div class="text-sm text-muted-foreground">
                    {content.length}/ 500 characters
                </div>
                <Button type="submit" size={"sm"} class="h-9 px-6">
                    {createPost.isPending ? (
                <Loader2Icon class="size-4 animate-spin" />
              ) : (
                "Post"
              )}
                </Button>
            </div>
        </div>
    </div> -->
</form>
