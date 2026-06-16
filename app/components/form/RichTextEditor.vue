<template>
  <div class="rich-text-editor">
    <!-- Toolbar — render hanya saat editor ready -->
    <div v-if="editor" class="toolbar flex flex-wrap gap-1 p-2 border border-gray-300 rounded-t-md bg-gray-50">
      <UButton
        size="xs"
        :variant="editor.isActive('bold') ? 'solid' : 'ghost'"
        :color="editor.isActive('bold') ? 'primary' : 'neutral'"
        icon="i-heroicons-bold"
        @click="editor.chain().focus().toggleBold().run()"
      />
      <UButton
        size="xs"
        :variant="editor.isActive('italic') ? 'solid' : 'ghost'"
        :color="editor.isActive('italic') ? 'primary' : 'neutral'"
        icon="i-heroicons-italic"
        @click="editor.chain().focus().toggleItalic().run()"
      />
      <UButton
        size="xs"
        :variant="editor.isActive('strike') ? 'solid' : 'ghost'"
        :color="editor.isActive('strike') ? 'primary' : 'neutral'"
        icon="mdi:format-strikethrough"
        @click="editor.chain().focus().toggleStrike().run()"
      />

      <USeparator orientation="vertical" class="mx-1 h-6" />

      <UButton
        size="xs"
        :variant="editor.isActive('heading', { level: 2 }) ? 'solid' : 'ghost'"
        :color="editor.isActive('heading', { level: 2 }) ? 'primary' : 'neutral'"
        label="H2"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      />
      <UButton
        size="xs"
        :variant="editor.isActive('heading', { level: 3 }) ? 'solid' : 'ghost'"
        :color="editor.isActive('heading', { level: 3 }) ? 'primary' : 'neutral'"
        label="H3"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      />

      <USeparator orientation="vertical" class="mx-1 h-6" />

      <UButton
        size="xs"
        :variant="editor.isActive('bulletList') ? 'solid' : 'ghost'"
        :color="editor.isActive('bulletList') ? 'primary' : 'neutral'"
        icon="i-heroicons-list-bullet"
        @click="editor.chain().focus().toggleBulletList().run()"
      />
      <UButton
        size="xs"
        :variant="editor.isActive('orderedList') ? 'solid' : 'ghost'"
        :color="editor.isActive('orderedList') ? 'primary' : 'neutral'"
        icon="mdi:format-list-numbered"
        @click="editor.chain().focus().toggleOrderedList().run()"
      />
      <UButton
        size="xs"
        :variant="editor.isActive('blockquote') ? 'solid' : 'ghost'"
        :color="editor.isActive('blockquote') ? 'primary' : 'neutral'"
        icon="i-heroicons-chat-bubble-bottom-center-text"
        @click="editor.chain().focus().toggleBlockquote().run()"
      />

      <USeparator orientation="vertical" class="mx-1 h-6" />

      <UButton
        size="xs"
        :variant="editor.isActive('link') ? 'solid' : 'ghost'"
        :color="editor.isActive('link') ? 'primary' : 'neutral'"
        icon="i-heroicons-link"
        @click="setLink"
      />
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        icon="mdi:format-clear"
        @click="editor.chain().focus().clearNodes().unsetAllMarks().run()"
      />

      <div class="ml-auto flex gap-1">
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-heroicons-arrow-uturn-left"
          :disabled="!editor.can().undo()"
          @click="editor.chain().focus().undo().run()"
        />
        <UButton
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-heroicons-arrow-uturn-right"
          :disabled="!editor.can().redo()"
          @click="editor.chain().focus().redo().run()"
        />
      </div>
    </div>

    <!-- Editor Content — hanya render saat editor ready -->
    <EditorContent
      v-if="editor"
      :editor="editor"
      class="border border-gray-300 border-t-0 rounded-b-md p-4 min-h-[200px] prose max-w-none focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-1"
    />
  </div>
</template>

<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// ✅ Fix Error 1: type explicit Editor | null + shallowRef
const editor = shallowRef<Editor | null>(null)

onMounted(() => {
  editor.value = new Editor({
    content: props.modelValue,
    extensions: [
      // ✅ MATIKAN LINK BAWAAN STARTERKIT DI SINI
      StarterKit.configure({
        link: false,
      }),
      // ✅ SEKARANG EXTENSION LINK INI TIDAK AKAN DUPLIKAT LAGI
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-500 underline',
        },
      }),
      Placeholder.configure({
        placeholder: props.placeholder ?? 'Tulis deskripsi produk...',
      }),
    ],
    onUpdate: ({ editor }) => {
      emit('update:modelValue', editor.getHTML())
    },
  })
})

// Sync external changes ke editor
watch(() => props.modelValue, (newValue) => {
  if (!editor.value) return
  if (editor.value.getHTML() === newValue) return
  
  // ✅ Fix Error 2: argumen kedua sekarang object, bukan boolean
  editor.value.commands.setContent(newValue, { emitUpdate: false })
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

function setLink() {
  if (!editor.value) return
  
  const url = window.prompt('Masukkan URL:')
  if (url === null) return
  
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}
</script>

<style>
.ProseMirror {
  min-height: 180px;
  outline: none;
}

.ProseMirror p.is-editor-empty:first-child::before {
  color: #9ca3af;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.ProseMirror h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.ProseMirror h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
}

.ProseMirror ul {
  list-style-type: disc;
  padding-left: 1.5rem;
}

.ProseMirror ol {
  list-style-type: decimal;
  padding-left: 1.5rem;
}

.ProseMirror blockquote {
  border-left: 3px solid #d1d5db;
  padding-left: 1rem;
  font-style: italic;
  color: #6b7280;
}

.ProseMirror a {
  color: rgb(var(--color-primary-500));
  text-decoration: underline;
}
</style>