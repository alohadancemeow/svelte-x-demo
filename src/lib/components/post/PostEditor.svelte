<script lang="ts">
  // export const ssr = false;

  // import { Editor } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import Placeholder from "@tiptap/extension-placeholder";
  import Link from "@tiptap/extension-link";
  import BubbleMenu from "@tiptap/extension-bubble-menu";
  import { onDestroy, onMount } from "svelte";

  import {
    // BubbleMenu,
    createEditor,
    Editor,
    EditorContent,
  } from "svelte-tiptap";
  import type { Readable } from "svelte/store";

  interface PostEditorProps {
    content: string;
    text: string;
    placeholder?: string;
    minHeight?: string;
  }

  let {
    content = $bindable(),
    text = $bindable(),
    placeholder,
    minHeight,
  }: PostEditorProps = $props();

  let bubbleMenu = $state();
  let editor = $state() as Readable<Editor>;

  onMount(() => {
    editor = createEditor({
      extensions: [
        StarterKit.configure({
          heading: false,
          codeBlock: false,
          horizontalRule: false,
        }),
        BubbleMenu.configure({
          element: bubbleMenu as HTMLElement | null | undefined,
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-primary underline underline-offset-4",
          },
        }),
        Placeholder.configure({
          placeholder: placeholder || "What's on your mind?",
          showOnlyCurrent: true,
        }),
      ],
      content,
      // content: `
      //   <h1>Hello Svelte! 🌍️ </h1>
      //   <p>This editor is running in Svelte.</p>
      //   <p>Select some text to see the bubble menu popping up.</p>
      // `,
      // Disable immediate rendering to prevent SSR issues
      // immediatelyRender: false,
      onUpdate: ({ editor }) => {
        content = editor.getHTML();
        text = editor.getText();
      },
      onTransaction: ({ editor }) => {
        // force re-render so `editor.isActive` works as expected
        editor = editor;
      },
      editorProps: {
        attributes: {
          class:
            "prose prose-sm dark:prose-invert max-w-none focus:outline-none",
          style: `min-height: ${minHeight}`,
        },
      },
    });
  });

  // onDestroy(() => {
  //   editor?.destroy();
  // });

  // $effect(() => {
  //   if (editor && content !== $editor.getHTML()) {
  //     $editor?.commands?.setContent(content);
  //   }
  // });
</script>

{#if editor}
  <EditorContent editor={$editor} />
{/if}
