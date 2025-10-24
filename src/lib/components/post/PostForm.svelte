<script lang="ts">
  import {
    Globe2Icon,
    ImagePlusIcon,
    Loader2Icon,
    SmilePlusIcon,
    XIcon,
    Sparkles,
  } from "@lucide/svelte";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { toast } from "svelte-sonner";
  import { authClient } from "$lib/auth-client";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { enhance } from "$app/forms";
  import {
    privacyOptions,
    feelingOptions,
    type Privacy,
    type Feeling,
  } from "$lib/components/post/data.js";
  import { useQueryClient } from "@tanstack/svelte-query";

  let fileInputRef: HTMLInputElement | null = $state(null);
  let isSubmitting = $state(false);
  let privacy: Privacy = $state("public");
  let feeling: Feeling | null = $state(null);
  let previewUrl: string | null = $state(null);
  let selectedImage: File | null = $state(null);
  let text: string = $state(""); // plain text content

  let session = authClient.useSession();
  const client = useQueryClient();

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

  const resetForm = () => {
    text = "";
    feeling = null;
    removeImage();
  };
</script>

<form
  method="POST"
  action="?/createPost"
  enctype="multipart/form-data"
  class="rounded-xl border bg-card transition-shadow"
  use:enhance={({ formData }) => {
    // Add the image file to form data if selected
    if (selectedImage && selectedImage.size > 0) {
      formData.append("image", selectedImage);
    } else {
      console.log("No image selected or image size is 0", {
        selectedImage,
        size: selectedImage?.size,
      });
    }

    isSubmitting = true;

    return async ({ result, update }) => {
      isSubmitting = false;

      if (result.type === "success") {
        console.log(result.data, "new post data");

        await client.invalidateQueries({ queryKey: ["posts"] });
        toast.success("Post created successfully!");
        resetForm();
      } else if (result.type === "failure") {
        console.log(result.data?.error);
        toast.error("Failed to create post");
      }

      await update();
    };
  }}
>
  <!-- Form Editor -->
  {@render editor()}
  <!-- Form Options -->
  {@render options()}
</form>

<!-- Form Editor Snippet -->
{#snippet editor()}
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
      </Avatar.Root>

      <!-- Post Editor -->
      <div class="flex-1 space-y-4">
        <div>
          <Textarea
            name="content"
            placeholder="What's on your mind?"
            bind:value={text}
            class="w-full min-h-[120px] text-xl leading-relaxed font-normal tracking-wide resize-none border-none bg-transparent px-2 outline-none transition-all duration-300 focus:bg-muted/20 focus:px-4 focus:py-6 focus:rounded-xl hover:rounded-lg placeholder:text-muted-foreground/60 placeholder:font-light placeholder:text-xl placeholder:tracking-wide selection:bg-primary/20"
          />
        </div>

        <!-- Hidden inputs for form data -->
        <input type="hidden" name="privacy" value={privacy} />
        {#if feeling}
          <input type="hidden" name="feeling" value={feeling} />
        {/if}

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
{/snippet}

<!-- Form Options Snippet -->
{#snippet options()}
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
        <Button
          disabled={(!text && !selectedImage) || isSubmitting}
          type="submit"
          size={"sm"}
          class="h-9 px-6"
        >
          {#if isSubmitting}
            <Loader2Icon class="size-4 animate-spin" />
          {:else}
            Post
          {/if}
        </Button>
      </div>
    </div>
  </div>
{/snippet}
