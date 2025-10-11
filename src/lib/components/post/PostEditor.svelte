<script lang="ts">
  // import { Editor } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import Placeholder from "@tiptap/extension-placeholder";
  import Link from "@tiptap/extension-link";
  import { onDestroy, onMount } from "svelte";

  import {
    BubbleMenu,
    createEditor,
    Editor,
    EditorContent,
  } from "svelte-tiptap";
  import type { Readable } from "svelte/store";

  interface PostEditorProps {
    content: string;
    // onChange: (content: string) => void;
    placeholder?: string;
    minHeight?: string;
  }

  let {
    content = $bindable(),
    placeholder,
    minHeight,
  }: PostEditorProps = $props();

  let bubbleMenu = $state();
  let editor = $state() as Readable<Editor>;

  // onMount(() => {
  //   editor = createEditor({
  //     extensions: [StarterKit],
  //     content: `Hello world!`,
  //   });
  // });

  onMount(() => {
    editor = createEditor({
      extensions: [
        StarterKit.configure({
          heading: false,
          codeBlock: false,
          horizontalRule: false,
        }),
        // BubbleMenu.configure({
        //   element: bubbleMenu,
        // }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-primary underline underline-offset-4",
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
      ],
      content,
      // Disable immediate rendering to prevent SSR issues
      // immediatelyRender: false,
      onUpdate: ({ editor }) => {
        // onChange(editor.getHTML());
        content = editor.getHTML();
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

  // useEffect(() => {
  //   if (editor && content !== editor.getHTML()) {
  //     editor.commands.setContent(content);
  //   }
  // }, [content, editor]);
</script>

{#if editor}
  <EditorContent editor={$editor}  />
{/if}
