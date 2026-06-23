"use client";

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, 
  List, ListOrdered, Quote, Undo, Redo, Image as ImageIcon, Link as LinkIcon 
} from 'lucide-react';
import styles from './TiptapEditor.module.css';
import { useCallback } from 'react';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

const MenuBar = ({ editor, onImageUpload }: { editor: any, onImageUpload?: (file: File) => Promise<string> }) => {
  if (!editor) {
    return null
  }

  const addImage = useCallback(() => {
    const url = window.prompt('URL de la imagen')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL del enlace', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  return (
    <div className={styles.toolbar}>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`${styles.toolbarBtn} ${editor.isActive('bold') ? styles.isActive : ''}`}
        title="Negrita"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`${styles.toolbarBtn} ${editor.isActive('italic') ? styles.isActive : ''}`}
        title="Cursiva"
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`${styles.toolbarBtn} ${editor.isActive('strike') ? styles.isActive : ''}`}
        title="Tachado"
      >
        <Strikethrough size={16} />
      </button>

      <div className={styles.divider}></div>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${styles.toolbarBtn} ${editor.isActive('heading', { level: 2 }) ? styles.isActive : ''}`}
        title="Título Grande"
      >
        <Heading1 size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`${styles.toolbarBtn} ${editor.isActive('heading', { level: 3 }) ? styles.isActive : ''}`}
        title="Subtítulo"
      >
        <Heading2 size={16} />
      </button>

      <div className={styles.divider}></div>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${styles.toolbarBtn} ${editor.isActive('bulletList') ? styles.isActive : ''}`}
        title="Lista de Puntos"
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${styles.toolbarBtn} ${editor.isActive('orderedList') ? styles.isActive : ''}`}
        title="Lista Numerada"
      >
        <ListOrdered size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`${styles.toolbarBtn} ${editor.isActive('blockquote') ? styles.isActive : ''}`}
        title="Cita"
      >
        <Quote size={16} />
      </button>

      <div className={styles.divider}></div>

      <button
        type="button"
        onClick={setLink}
        className={`${styles.toolbarBtn} ${editor.isActive('link') ? styles.isActive : ''}`}
        title="Insertar Enlace"
      >
        <LinkIcon size={16} />
      </button>

      <button
        type="button"
        onClick={addImage}
        className={styles.toolbarBtn}
        title="Insertar Imagen por URL"
      >
        <ImageIcon size={16} />
      </button>

      <div className={styles.divider}></div>

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className={styles.toolbarBtn}
      >
        <Undo size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className={styles.toolbarBtn}
      >
        <Redo size={16} />
      </button>
    </div>
  )
}

export default function TiptapEditor({ content, onChange, onImageUpload }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Escribe tu increíble artículo aquí...',
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: styles.prose,
      },
    },
  });

  return (
    <div className={styles.editorWrapper}>
      <MenuBar editor={editor} onImageUpload={onImageUpload} />
      <EditorContent editor={editor} />
    </div>
  );
}
