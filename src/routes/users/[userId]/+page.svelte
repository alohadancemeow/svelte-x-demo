<script lang="ts">
  import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "$lib/components/ui/avatar";
  import { Button } from "$lib/components/ui/button/index.js";
  import {
    CalendarIcon,
    ArrowLeftIcon,
    SearchIcon,
    MapPinIcon,
    UserPlusIcon,
    MailIcon,
    Ellipsis,
  } from "@lucide/svelte";
  import type { PageData } from "./$types";
  import { toast } from "svelte-sonner";
  import { goto } from "$app/navigation";
  import { enhance } from "$app/forms";
  import { invalidateAll } from "$app/navigation";

  let { data }: { data: PageData } = $props();

  // Format join date
  const formatJoinDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
    }).format(new Date(date));
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };
</script>

<!-- Profile Page -->
<div class="min-h-[calc(100vh-150px)] bg-background">
  <!-- Header Navigation -->
  <div class="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center justify-between px-4 py-2">
        <div class="flex items-center gap-8">
          <Button
            variant="ghost"
            size="icon"
            href="/"
            class="p-2 hover:bg-muted rounded-full"
          >
            <ArrowLeftIcon class="w-5 h-5" />
          </Button>
          <div>
            <h1 class="text-2xl font-bold">{data.user.name}</h1>
            <p class="text-sm text-muted-foreground">
              {data.stats.totalPosts} posts
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          class="p-2 hover:bg-muted rounded-full"
          onclick={() => {
            toast.info("Search feature is coming soon!");
          }}
        >
          <SearchIcon class="w-5 h-5" />
        </Button>
      </div>
    </div>
  </div>

  <!-- Main Content Container -->
  <div class="max-w-3xl mx-auto">
    <!-- Cover Image / Banner -->
    <div class="relative">
      <div
        class="h-48 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 relative overflow-hidden"
      >
        <div class="absolute inset-0 opacity-20"></div>
      </div>

      <!-- Avatar overlapping the banner -->
      <div class="absolute -bottom-16 left-4">
        <div class="relative">
          <Avatar class="w-42 h-42 border-4 border-background">
            <AvatarImage src={data.user.image} alt={data.user.name} />
            <AvatarFallback class="text-3xl font-semibold">
              {getUserInitials(data.user.name)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <!-- Action Buttons - Conditional based on profile ownership -->
      <div class="absolute -bottom-10 right-4">
        {#if data.isOwnProfile}
          <!-- Edit Profile Button for own profile -->
          <Button
            variant="outline"
            class="bg-background border-border hover:bg-muted rounded-3xl"
            onclick={() => {
              toast.info("Edit profile is coming soon!");
            }}
          >
            Edit profile
          </Button>
        {:else if data.currentUser}
          <!-- Follow and Message buttons for other users when logged in -->
          <div class="flex gap-1.5">
            <Button
              variant="outline"
              size="icon"
              class="bg-background border-border hover:bg-muted p-2 rounded-full"
              onclick={() => {
                toast.info("More options feature coming soon!");
              }}
            >
              <Ellipsis class="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              class="bg-background border-border hover:bg-muted p-2 rounded-full"
              onclick={() => {
                toast.info("Message feature coming soon!");
              }}
            >
              <MailIcon class="h-4 w-4" />
            </Button>

            <!-- Follow/Unfollow Button -->
            <form
              method="POST"
              use:enhance={({ formData }) => {
                formData.set("userId", data.user.id);

                return async ({ result, update }) => {
                  if (result.type === "success") {
                    await invalidateAll();
                    await update();
                  } else if (result.type === "failure") {
                    console.log(result.data?.error);
                    toast.error("Failed to follow user");
                  }
                };
              }}
            >
              <Button
                type="submit"
                variant="outline"
                class="bg-background border-border rounded-3xl {data.isFollowing
                  ? 'hover:bg-red-500 hover:text-white hover:border-red-500'
                  : 'hover:bg-muted'}"
              >
                <UserPlusIcon class="h-4 w-4" />
                {data.isFollowing ? "Unfollow" : "Follow"}
              </Button>
            </form>
          </div>
        {:else}
          <!-- For non-logged in users, show buttons that prompt to sign in -->
          <div class="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              class="bg-background border-border hover:bg-muted p-2 rounded-full"
              onclick={() => {
                toast.error("Please sign in to interact", {
                  action: {
                    label: "Sign In",
                    onClick: () => {
                      goto("/auth/sign-in");
                    },
                  },
                });
              }}
            >
              <MailIcon class="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              class="bg-background border-border hover:bg-muted rounded-3xl"
              onclick={() => {
                toast.error("Please sign in to interact", {
                  action: {
                    label: "Sign In",
                    onClick: () => {
                      goto("/auth/sign-in");
                    },
                  },
                });
              }}
            >
              <UserPlusIcon class="h-4 w-4" />
              Follow
            </Button>
          </div>
        {/if}
      </div>
    </div>

    <!-- Profile Info -->
    <div class="px-4 pt-20 pb-4">
      <!-- User Name and Handle -->
      <div class="mb-3">
        <h1 class="text-2xl font-bold">{data.user.name}</h1>
        <p class="text-muted-foreground">@{data.user.name}</p>
      </div>

      <!-- Bio -->
      <div class="mb-3">
        <p class="text-foreground">Simple yet effective.</p>
      </div>

      <!-- Location and Join Date -->
      <div class="flex items-center gap-4 mb-3 text-muted-foreground text-sm">
        <div class="flex items-center gap-1">
          <MapPinIcon class="w-4 h-4" />
          <span>Thailand</span>
        </div>
        <div class="flex items-center gap-1">
          <CalendarIcon class="w-4 h-4" />
          <span>Joined {formatJoinDate(data.user.createdAt)}</span>
        </div>
      </div>

      <!-- Following and Followers -->
      <div class="flex items-center gap-4 mb-4">
        <div class="flex items-center gap-1">
          <span class="font-bold">{data.stats.followingCount}</span>
          <span class="text-muted-foreground">Following</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="font-bold">{data.stats.followersCount}</span>
          <span class="text-muted-foreground">Followers</span>
        </div>
      </div>

      <!-- Verification Notice -->
      {#if data.user.emailVerified}
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 my-8">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-foreground font-semibold mb-1">
                You aren't verified yet ✓
              </h3>
              <p class="text-green-600 text-sm mb-3">
                Get verified for boosted replies, analytics, ad-free browsing,
                and more. Upgrade your profile now.
              </p>
              <Button
                onclick={() => {
                  toast.info("Get verified feature is coming soon!");
                }}
                class="bg-green-600 hover:bg-green-700 text-white"
              >
                Get verified
              </Button>
            </div>
            <Button
              variant="ghost"
              class="p-1 text-muted-foreground hover:text-foreground"
            >
              ✕
            </Button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
