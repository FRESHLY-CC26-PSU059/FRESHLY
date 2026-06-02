import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  X,
} from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  title: string;
  placeholder: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

const PromptModal = ({ isOpen, title, placeholder, onConfirm, onClose }: PromptModalProps) => {
  const [value, setValue] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-app-surface border border-app-border rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-app-text-primary">{title}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-app-bg text-app-text-secondary"><X size={16} /></button>
        </div>
        <input
          autoFocus
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-app-border bg-app-bg text-app-text-primary placeholder-app-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) { onConfirm(value.trim()); setValue(''); } if (e.key === 'Escape') onClose(); }}
        />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold rounded-xl border border-app-border text-app-text-secondary hover:bg-app-bg">Batal</button>
          <button type="button" onClick={() => { if (value.trim()) { onConfirm(value.trim()); setValue(''); } }} className="px-4 py-2 text-xs font-bold rounded-xl green-gradient text-white shadow-lg shadow-emerald-500/20">Tambahkan</button>
        </div>
      </div>
    </div>
  );
};

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor, onAddLink, onAddImage }: { editor: any; onAddLink: () => void; onAddImage: () => void }) => {
  if (!editor) return null;

  const buttonClass = (isActive: boolean) =>
    `p-2 rounded-lg transition-all ${
      isActive
        ? 'bg-primary-500 text-white'
        : 'text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary'
    }`;

  return (
    <div className="border-b border-app-border bg-app-surface p-2 flex flex-wrap gap-1">
      {/* Text Formatting */}
      <div className="flex gap-1 border-r border-app-border pr-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={buttonClass(editor.isActive('bold'))}
          title="Bold"
          type="button"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={buttonClass(editor.isActive('italic'))}
          title="Italic"
          type="button"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={buttonClass(editor.isActive('underline'))}
          title="Underline"
          type="button"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={buttonClass(editor.isActive('strike'))}
          title="Strikethrough"
          type="button"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={buttonClass(editor.isActive('code'))}
          title="Code"
          type="button"
        >
          <Code className="w-4 h-4" />
        </button>
      </div>

      {/* Headings */}
      <div className="flex gap-1 border-r border-app-border pr-2">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={buttonClass(editor.isActive('heading', { level: 1 }))}
          title="Heading 1"
          type="button"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={buttonClass(editor.isActive('heading', { level: 2 }))}
          title="Heading 2"
          type="button"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={buttonClass(editor.isActive('heading', { level: 3 }))}
          title="Heading 3"
          type="button"
        >
          <Heading3 className="w-4 h-4" />
        </button>
      </div>

      {/* Lists */}
      <div className="flex gap-1 border-r border-app-border pr-2">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={buttonClass(editor.isActive('bulletList'))}
          title="Bullet List"
          type="button"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={buttonClass(editor.isActive('orderedList'))}
          title="Ordered List"
          type="button"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={buttonClass(editor.isActive('blockquote'))}
          title="Quote"
          type="button"
        >
          <Quote className="w-4 h-4" />
        </button>
      </div>

      {/* Alignment */}
      <div className="flex gap-1 border-r border-app-border pr-2">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={buttonClass(editor.isActive({ textAlign: 'left' }))}
          title="Align Left"
          type="button"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={buttonClass(editor.isActive({ textAlign: 'center' }))}
          title="Align Center"
          type="button"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={buttonClass(editor.isActive({ textAlign: 'right' }))}
          title="Align Right"
          type="button"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={buttonClass(editor.isActive({ textAlign: 'justify' }))}
          title="Justify"
          type="button"
        >
          <AlignJustify className="w-4 h-4" />
        </button>
      </div>

      {/* Insert */}
      <div className="flex gap-1 border-r border-app-border pr-2">
        <button
          onClick={onAddLink}
          className={buttonClass(editor.isActive('link'))}
          title="Add Link"
          type="button"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          onClick={onAddImage}
          className={buttonClass(false)}
          title="Add Image"
          type="button"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Undo/Redo */}
      <div className="flex gap-1">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-2 rounded-lg text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          title="Undo"
          type="button"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-2 rounded-lg text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          title="Redo"
          type="button"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const TiptapEditor = ({ value, onChange, placeholder = 'Start writing...' }: TiptapEditorProps) => {
  const [promptModal, setPromptModal] = useState<{ type: 'link' | 'image' } | null>(null);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-500 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="border border-app-border rounded-xl overflow-hidden bg-app-bg">
      <MenuBar
        editor={editor}
        onAddLink={() => setPromptModal({ type: 'link' })}
        onAddImage={() => setPromptModal({ type: 'image' })}
      />
      <EditorContent editor={editor} />
      <PromptModal
        isOpen={promptModal?.type === 'link'}
        title="Tambahkan Link"
        placeholder="https://example.com"
        onConfirm={(url) => { editor?.chain().focus().setLink({ href: url }).run(); setPromptModal(null); }}
        onClose={() => setPromptModal(null)}
      />
      <PromptModal
        isOpen={promptModal?.type === 'image'}
        title="Tambahkan Gambar"
        placeholder="https://example.com/image.jpg"
        onConfirm={(url) => { editor?.chain().focus().setImage({ src: url }).run(); setPromptModal(null); }}
        onClose={() => setPromptModal(null)}
      />
    </div>
  );
};
