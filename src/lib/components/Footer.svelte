<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { authClient } from "$lib/auth-client";
  import { LogOutIcon, LogInIcon } from "@lucide/svelte";
  import { toast } from "svelte-sonner";
  import { goto } from "$app/navigation";

  const session = authClient.useSession();
  const currentYear = new Date().getFullYear();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      // toast.success("Successfully logged out");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  const handleSignIn = () => {
    goto("/auth/sign-in");
  };
</script>

<footer
  class=" max-w-3xl mx-auto mt-8 border-t border-border/40 bg-gradient-to-r from-background via-muted/20 to-background backdrop-blur-sm"
>
  <div class="container mx-auto px-4 py-6">
    <div class="flex items-center justify-between">
      <!-- Left side - App info -->
      <div class="flex items-center gap-2">
        <div class="text-sm text-muted-foreground">
          <span class="font-medium text-foreground">X Demo</span>
          <span class="mx-2">•</span>
          <span>Social Media Platform</span>
        </div>
      </div>

      <!-- Right side - Auth button -->
      <div class="flex items-center gap-4">
        {#if $session.data}
          <Button
            type="button"
            variant="outline"
            size="sm"
            class="h-9 px-4 gap-2 hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200"
            onclick={handleLogout}
          >
            <LogOutIcon class="h-4 w-4" />
            Logout
          </Button>
        {:else}
          <Button
            type="button"
            variant="outline"
            size="sm"
            class="h-9 px-4 gap-2 hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
            onclick={handleSignIn}
          >
            <LogInIcon class="h-4 w-4" />
            Sign In
          </Button>
        {/if}
      </div>
    </div>

    <!-- Bottom section - Copyright -->
    <div class="mt-4 pt-4 border-t border-border/20 text-center">
      <p class="text-xs text-muted-foreground">
        © {currentYear} X Demo. Built with SvelteKit & Drizzle + Better Auth.
      </p>
    </div>
  </div>
</footer>
