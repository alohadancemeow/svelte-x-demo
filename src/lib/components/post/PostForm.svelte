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
    Sparkles,
  } from "@lucide/svelte";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { toast } from "svelte-sonner";
  // import { useCreatePost } from "@/hooks/use-posts";
  import PostEditor from "$lib/components/post/PostEditor.svelte";
  import { authClient } from "$lib/auth-client";
  // import Editor from "../editor/editor.svelte";

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

  let fileInputRef: HTMLInputElement | null = $state(null);
  const createPost = { isPending: false };

  let privacy: Privacy = $state("public");
  let feeling: Feeling | null = $state(null);
  let previewUrl: string | null = $state(null);
  let selectedImage: File | null = $state(null);
  let content: string = $state(""); // include html tags
  let text: string = $state(""); // plain text

  let session = authClient.useSession();

  const handleImageSelect = (event: any) => {
    const file = event.target.files?.[0];

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        return;
      }
      selectedImage = file;

      const url = URL.createObjectURL(file);
      previewUrl = url;
    }
  };

  const removeImage = () => {
    selectedImage = null;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }

    if (fileInputRef) {
      fileInputRef.value = "";
    }
  };

  const selectedPrivacy = $derived(
    privacyOptions.find((option) => option.value === privacy)
  );

  const PrivacyIcon = $derived(selectedPrivacy?.icon || Globe2Icon);

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

  // $inspect(content, "content");
</script>

<form class="rounded-xl border bg-card transition-shadow">
  <div class="p-4 space-y-4">
    <div class="flex gap-3">
      <Avatar.Root>
        <Avatar.Image
          src={$session?.data?.user?.image || ""}
          alt={$session?.data?.user?.name || ""}
        />
        <Avatar.Fallback
          >{$session?.data?.user?.name?.charAt(0)}
        </Avatar.Fallback>
        <!-- <Avatar.Image
                    src="https://github.com/shadcn.png"
                    alt="@shadcn"
                />
                <Avatar.Fallback>CN</Avatar.Fallback> -->
      </Avatar.Root>

      <!-- Post Editor -->
      <div class="flex-1 space-y-4">
        <div>
          <PostEditor
            bind:content
            bind:text
            placeholder="What's on your mind?"
            minHeight="120px"
          />
        </div>

        {#if feeling !== null}
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Feeling</span>
            <span class="font-medium text-foreground">{feeling}</span>
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

  <!-- Post Options -->
  <div class="border-t bg-muted/40 p-3">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-0.5">
          <!-- Image Select -->
          <input
            bind:this={fileInputRef}
            type="file"
            accept="image/*"
            class="hidden"
            id="image-upload"
            onchange={handleImageSelect}
          />
          <Button
            type="button"
            variant={"ghost"}
            size={"icon"}
            class="size-9"
            onclick={() => fileInputRef?.click()}
            disabled={false}
          >
            <ImagePlusIcon class="size-5" />
          </Button>

          <!-- Feeling Select -->
          <Popover.Root>
            <Popover.Trigger>
              <Button
                type="button"
                variant={"ghost"}
                size={"icon"}
                class="size-9"
                disabled={false}
              >
                <SmilePlusIcon class="size-5" />
              </Button>
            </Popover.Trigger>
            <Popover.Content class="w-64 p-2" align="start">
              <div class="grid grid-cols-3 gap-1">
                {#each feelingOptions as feel, index (index)}
                  <Button
                    variant={feeling === feel ? "secondary" : "ghost"}
                    class="justify-start h-8 px-2 text-xs"
                    onclick={() => (feeling = feeling === feel ? null : feel)}
                    disabled={feeling === feel}
                    type="button"
                  >
                    {feel}
                  </Button>
                {/each}
              </div>
            </Popover.Content>
          </Popover.Root>
          <Button
            type="button"
            variant={"ghost"}
            size={"icon"}
            class="size-9"
            disabled={false}
            onclick={() => {}}
          >
            <Sparkles class="size-5" />
          </Button>
        </div>
        <Separator orientation="vertical" class="h-6" />

        <!-- Post Privacy Select -->
        <Select.Root type="single" bind:value={privacy} name="postPrivacy">
          <Select.Trigger
            class="h-9 w-auto border-none bg-transparent px-3 hover:bg-accent [&>span]:flex [&>span]:items-center [&>span]:gap-2"
          >
            <div class="flex items-center gap-2">
              <PrivacyIcon class="size-4" />
              <span class="text-sm">{selectedPrivacy?.label ?? privacy}</span>
            </div>
          </Select.Trigger>
          <Select.Content align="start" class="w-52">
            <Select.Group>
              {#each privacyOptions as option (option.value)}
                <Select.Item
                  value={option.value}
                  label={option.label}
                  class="py-2.5"
                >
                  <div class="flex items-start gap-2">
                    <option.icon class="size-4 mt-0.5" />
                    <div>
                      <div class="text-sm">
                        {option.label}
                      </div>
                      <div class="text-xs text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </Select.Item>
              {/each}
            </Select.Group>
          </Select.Content>
        </Select.Root>
      </div>

      <div class="flex items-center gap-4">
        <div class="text-sm text-muted-foreground">
          {text.length}/ 500 characters
        </div>
        <Button type="submit" size={"sm"} class="h-9 px-6">
          {#if createPost.isPending}
            <Loader2Icon class="size-4 animate-spin" />
          {:else}
            Post
          {/if}
        </Button>
      </div>
    </div>
  </div>
</form>
