import { useState, useEffect } from 'react';
import { Bot, User, Copy, Check, Edit2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

// Lazy-load syntax highlighter (~900KB) — only when code blocks appear
let _SH: any = null;
let _theme: any = null;
let _loadPromise: Promise<void> | null = null;
function loadHighlighter() {
  if (!_loadPromise) {
    _loadPromise = Promise.all([
      // @ts-ignore
      import('react-syntax-highlighter/dist/esm/prism-light'),
      // @ts-ignore
      import('react-syntax-highlighter/dist/esm/styles/prism'),
    ]).then(([mod, styles]) => {
      _SH = mod.default || mod;
      _theme = styles.oneDark;
    });
  }
  return _loadPromise;
}

const CodeBlock = ({ language, children }: { language: string; children: string }) => {
  const [ready, setReady] = useState(!!_SH);
  useEffect(() => {
    if (!_SH) loadHighlighter().then(() => setReady(true));
  }, []);
  if (ready && _SH) {
    return (
      <_SH style={_theme} language={language} PreTag="div" className="rounded-lg text-xs overflow-x-auto !my-3">
        {children}
      </_SH>
    );
  }
  return <pre className="rounded-lg text-xs overflow-x-auto !my-3 bg-gray-900 text-gray-100 p-4"><code>{children}</code></pre>;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const API_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return API_URL.replace(/\/api\/v\d+\/?$/, '');
  }
})();

const resolveImageSrc = (url?: string | null) => {
  if (!url) return undefined;
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image_url?: string;
}

interface ChatMessageProps {
  message: Message;
  onEdit?: (newContent: string) => void;
  isStreaming?: boolean;
}

export const ChatMessage = ({ message, onEdit, isStreaming }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditSave = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(editContent.trim());
      toast.success('Message updated!');
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  if (message.role === 'user') {
    return (
      <div className="flex gap-3 justify-end group">
        <div className="flex flex-col items-end gap-2 max-w-[80%] sm:max-w-[70%]">
          {isEditing ? (
            <div className="w-full">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEditSave();
                  }
                  if (e.key === 'Escape') {
                    handleEditCancel();
                  }
                }}
                placeholder="Edit pesan..."
                className="w-full rounded-2xl rounded-br-md px-4 py-3 text-sm leading-relaxed border-2 border-primary-500 bg-app-surface text-app-text-primary focus:outline-none resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 mt-2 justify-end">
                <button
                  onClick={handleEditCancel}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg text-app-text-secondary hover:bg-app-surface transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-500 text-white hover:brightness-110 transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-2xl rounded-br-md px-4 py-3 bg-primary-500 text-white shadow-sm overflow-hidden flex flex-col gap-2">
                {message.image_url && (
                  <div className="max-w-xs rounded-lg overflow-hidden border border-white/20 bg-black/10">
                    <img 
                      src={resolveImageSrc(message.image_url)} 
                      alt="Uploaded fruit" 
                      className="w-full h-auto max-h-48 object-cover"
                    />
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
              </div>
              {onEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg bg-app-surface/80 text-app-text-secondary hover:bg-app-surface hover:text-primary-600 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shadow-sm"
                  title="Edit message"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-app-surface border border-app-border text-app-text-secondary">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 group">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600">
        <Bot className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const inline = !String(children).includes('\n');
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <CodeBlock language={match[1]}>
                    {String(children).replace(/\n$/, '')}
                  </CodeBlock>
                ) : (
                  <code className="bg-app-surface px-1.5 py-0.5 rounded text-xs font-mono break-all" {...props}>
                    {children}
                  </code>
                );
              },
              p: ({ children }) => <p className="text-sm leading-relaxed mb-3 last:mb-0 break-words text-app-text-primary">{children}</p>,
              ul: ({ children }) => <ul className="text-sm space-y-1.5 mb-3 list-disc list-inside">{children}</ul>,
              ol: ({ children }) => <ol className="text-sm space-y-1.5 mb-3 list-decimal list-inside">{children}</ol>,
              li: ({ children }) => <li className="text-sm break-words text-app-text-primary">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-app-text-primary">{children}</strong>,
              h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-app-text-primary">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-bold mb-2 text-app-text-primary">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-bold mb-2 text-app-text-primary">{children}</h3>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary-500/30 pl-4 italic text-app-text-secondary my-3">
                  {children}
                </blockquote>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-primary-500 ml-0.5 animate-pulse align-middle" />
          )}
        </div>
        <button
          onClick={handleCopy}
          className="mt-2 p-1.5 rounded-lg text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          title="Copy message"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};
