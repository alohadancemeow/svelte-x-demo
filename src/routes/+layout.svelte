<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import { QueryClientProvider } from "@tanstack/svelte-query";
  import type { LayoutProps } from "./$types";
  import { Toaster } from "$lib/components/ui/sonner/index.js";
  import Footer from "$lib/components/Footer.svelte";

  let { data, children }: LayoutProps = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div>
  <QueryClientProvider client={data.queryClient}>
    <main class="mx-auto antialiased">
      {@render children()}
    </main>
    <Footer />
    <Toaster />
  </QueryClientProvider>
</div>
