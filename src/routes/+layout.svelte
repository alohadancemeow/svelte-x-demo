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
  <!-- Basic Meta Tags -->
  <title>Svelte X Demo - Social Media Platform</title>
  <meta name="description" content="A modern web application built with SvelteKit, featuring authentication, database integration, and responsive design. Explore the power of Svelte for building fast, interactive web experiences." />
  <meta name="keywords" content="svelte, sveltekit, web development, javascript, typescript, modern web app, authentication, responsive design" />
  <meta name="author" content="Svelte X Demo" />
  <meta name="robots" content="index, follow" />
  <meta name="language" content="en" />
  
  <!-- Viewport and Mobile Optimization -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no" />
  <meta name="theme-color" content="#1a1a1a" />
  <meta name="color-scheme" content="light dark" />
  
  <!-- Favicon and Icons -->
  <link rel="icon" href={favicon} />
  <link rel="apple-touch-icon" href={favicon} />
  
  <!-- Open Graph Meta Tags for Social Media -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Svelte X Demo - Social Media Platform" />
  <meta property="og:description" content="A modern web application built with SvelteKit, featuring authentication, database integration, and responsive design." />
  <meta property="og:url" content="https://your-domain.com" />
  <meta property="og:site_name" content="Svelte X Demo" />
  <meta property="og:locale" content="en_US" />
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Svelte X Demo - Social Media Platform" />
  <meta name="twitter:description" content="A modern web application built with SvelteKit, featuring authentication, database integration, and responsive design." />
  
  <!-- Additional SEO and Performance -->
  <meta name="format-detection" content="telephone=no" />
  <meta name="msapplication-TileColor" content="#1a1a1a" />
  <link rel="canonical" href="https://your-domain.com" />
  
  <!-- Preconnect to external domains for performance -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
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
