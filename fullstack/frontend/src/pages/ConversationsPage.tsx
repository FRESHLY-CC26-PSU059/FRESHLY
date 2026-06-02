import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { MessageSquare, Send, Plus, Trash2, Bot, PanelLeft, PanelLeftClose, Edit2, Copy, Check, Search, X, Paperclip, Square, CheckSquare } from 'lucide-react';
import { ConfirmDialog } from '../components/ui';
import { LottiePlayer } from '../components/ui/LottiePlayer';
import { ChatMessage } from '../components/ChatMessage';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import useSEO from '../hooks/useSEO';

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

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages?: Message[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  image_url?: string;
}

const ConversationsPage = () => {
  useSEO({
    title: 'Tanya AI',
    description: 'Tanyakan apa saja tentang buah, nutrisi, atau hasil scan Anda kepada asisten AI Freshly.',
    robots: 'noindex, nofollow',
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const scanId = searchParams.get('scanId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [panelOpen, setPanelOpen] = useState(() => window.innerWidth >= 1024);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [convoSearch, setConvoSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamRef = useRef<number | undefined>(undefined);

  // Image Upload Support
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [preloadedImage, setPreloadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk Selection and Deletion
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const filteredConversations = useMemo(() => {
    if (!convoSearch.trim()) return conversations;
    const q = convoSearch.toLowerCase();
    return conversations.filter(c => (c.title || '').toLowerCase().includes(q));
  }, [conversations, convoSearch]);

  // Determine base path based on user role
  const basePath = useMemo(() => {
    const isAdmin = ['admin', 'super_admin'].includes(user?.role || '');
    return isAdmin ? '/admin/conversations' : '/user/conversations';
  }, [user?.role]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  const streamResponse = useCallback((fullResponse: string) => {
    if (streamRef.current) cancelAnimationFrame(streamRef.current);
    setIsStreaming(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    let i = 0;
    const chunkSize = Math.max(1, Math.ceil(fullResponse.length / 80));
    const frame = () => {
      i = Math.min(i + chunkSize, fullResponse.length);
      setMessages(prev => {
        const msgs = [...prev];
        if (msgs.length && msgs[msgs.length - 1].role === 'assistant') {
          msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: fullResponse.slice(0, i) };
        }
        return msgs;
      });
      if (i < fullResponse.length) {
        streamRef.current = requestAnimationFrame(frame);
      } else {
        setIsStreaming(false);
      }
    };
    streamRef.current = requestAnimationFrame(frame);
  }, []);

  // Cancel streaming animation on unmount.
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        cancelAnimationFrame(streamRef.current);
      }
    };
  }, []);

  const fetchConversations = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoadingList(true);
      const res = await api.get('/chat/conversations');
      setConversations(res.data.data || []);
    } catch { /* silent */ } finally { setLoadingList(false); }
  }, []);

  useEffect(() => { fetchConversations(true); }, [fetchConversations]);

  // Auto-resize textarea
  const autoResizeTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  }, []);

  // Preload scan details if scanId query param is present
  useEffect(() => {
    if (scanId) {
      const fetchScanDetails = async () => {
        try {
          const res = await api.get(`/scans/${scanId}`);
          const scan = res.data.data?.scan || res.data.data;
          if (scan) {
            const text = `Halo, saya baru saja melakukan scan buah ${scan.object_name || 'tidak diketahui'}. Hasil analisis kematangan: ${scan.ripeness_level || '-'}, status: ${scan.is_consumable ? 'Layak Konsumsi' : 'Tidak Layak Konsumsi'}. Rekomendasi: ${scan.recommendation || '-'}. Ada tips penyimpanan atau informasi gizi tambahan?`;
            setInput(text);
            setPreloadedImage(scan.image_url || null);
            // Clear search param so it doesn't trigger again
            setSearchParams({});
            // Auto-focus textarea and move cursor to end
            requestAnimationFrame(() => {
              const ta = textareaRef.current;
              if (ta) {
                ta.focus();
                ta.selectionStart = ta.selectionEnd = text.length;
                ta.style.height = 'auto';
                ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
              }
            });
          }
        } catch (err) {
          toast.error('Gagal memuat detail scan');
        }
      };
      fetchScanDetails();
    }
  }, [scanId, setSearchParams]);

  // Load conversation from URL param
  useEffect(() => {
    if (id && conversations.length > 0) {
      const convo = conversations.find(c => c.id === id);
      if (convo) {
        loadConversation(convo);
      }
    } else if (!id) {
      // New chat
      setActiveConvo(null);
      setMessages([]);
    }
  }, [id, conversations]);

  const loadConversation = async (convo: Conversation) => {
    try {
      const res = await api.get(`/chat/conversations/${convo.id}`);
      const data = res.data.data?.conversation || res.data.data;
      setActiveConvo(convo);
      setMessages(data?.messages || []);
      navigate(`${basePath}/${convo.id}`);
    } catch { toast.error('Gagal memuat percakapan'); }
  };

  const startNewChat = () => { 
    setActiveConvo(null); 
    setMessages([]); 
    setInput(''); 
    clearSelectedFile();
    navigate(basePath);
  };

  // Image helpers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan');
      return;
    }
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
    setPreloadedImage(null);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setPreloadedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Bulk deletion helpers
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedIds(new Set());
  };

  const handleSelectConvo = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredConversations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredConversations.map(c => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      await api.post('/chat/conversations/bulk-delete', { ids: Array.from(selectedIds) });
      if (activeConvo && selectedIds.has(activeConvo.id)) {
        startNewChat();
      }
      fetchConversations();
      toast.success('Percakapan terpilih berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus percakapan terpilih');
    } finally {
      setSelectedIds(new Set());
      setIsSelectMode(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete('/chat/conversations/clear-all');
      startNewChat();
      fetchConversations();
      toast.success('Seluruh riwayat percakapan berhasil dihapus');
    } catch {
      toast.error('Gagal menghapus seluruh riwayat percakapan');
    } finally {
      setShowClearConfirm(false);
      setIsSelectMode(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending || isStreaming) return;
    
    const userMsg: Message = { 
      role: 'user', 
      content: input.trim(),
      image_url: filePreview || preloadedImage || undefined
    };
    const wasNewChat = !activeConvo;
    
    const fileToSend = selectedFile;
    const preloadedImageToSend = preloadedImage;
    clearSelectedFile();

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    
    try {
      const fd = new FormData();
      fd.append('message', userMsg.content);
      if (activeConvo) fd.append('conversationId', activeConvo.id);
      if (fileToSend) fd.append('image', fileToSend);
      if (preloadedImageToSend) fd.append('imageUrl', preloadedImageToSend);
      
      const res = await api.post('/chat', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = res.data.data;

      // Set conversation and navigate to new URL
      const newConvoId = data.conversationId || data.conversation_id;
      if (wasNewChat && newConvoId) {
        const newConvo = { 
          id: newConvoId, 
          title: userMsg.content.slice(0, 50), 
          createdAt: new Date().toISOString() 
        };
        setActiveConvo(newConvo);
        setConversations(prev => [newConvo, ...prev]);
        navigate(`${basePath}/${newConvoId}`);
      }

      setSending(false);
      // Backend returns { conversationId, message }; older deploys used `reply`.
      streamResponse(data.message || data.reply || 'Maaf, saya tidak bisa menjawab saat ini.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengirim pesan');
      setMessages(prev => prev.slice(0, -1));
      setInput(userMsg.content);
      setSending(false);
    }
  };

  const handleEditMessage = async (index: number, newContent: string) => {
    if (!activeConvo) return;
    
    // Update local state optimistically
    const updatedMessages = [...messages];
    updatedMessages[index] = { ...updatedMessages[index], content: newContent };
    setMessages(updatedMessages);
    
    // In a real implementation, you would:
    // 1. Send the edited message to backend
    // 2. Regenerate the conversation from that point
    // For now, we just update locally
    toast.info('Edit feature: Backend integration coming soon');
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/chat/conversations/${id}`);
      if (activeConvo?.id === id) startNewChat();
      fetchConversations();
      toast.success('Percakapan berhasil dihapus');
    } catch { toast.error('Gagal menghapus percakapan'); }
    finally { setDeleteId(null); }
  };

  const handleEditStart = (convo: Conversation) => {
    setEditingId(convo.id);
    setEditTitle(convo.title);
  };

  const handleEditSave = async (id: string) => {
    if (!editTitle.trim()) {
      toast.error('Judul tidak boleh kosong');
      return;
    }
    try {
      await api.patch(`/chat/conversations/${id}`, { title: editTitle.trim() });
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: editTitle.trim() } : c));
      if (activeConvo?.id === id) {
        setActiveConvo(prev => prev ? { ...prev, title: editTitle.trim() } : null);
      }
      toast.success('Judul berhasil diubah');
      setEditingId(null);
    } catch { 
      toast.error('Gagal mengubah judul'); 
    }
  };

  const handleCopy = async (convo: Conversation) => {
    try {
      const res = await api.get(`/chat/conversations/${convo.id}`);
      const data = res.data.data?.conversation || res.data.data;
      const messagesText = (data?.messages || [])
        .map((m: Message) => `${m.role === 'user' ? 'Anda' : 'AI'}: ${m.content}`)
        .join('\n\n');
      
      await navigator.clipboard.writeText(messagesText);
      setCopiedId(convo.id);
      toast.success('Percakapan berhasil disalin');
      setTimeout(() => setCopiedId(null), 2000);
    } catch { 
      toast.error('Gagal menyalin percakapan'); 
    }
  };

  return (
    <div className="absolute inset-0 -mx-4 md:-mx-6 -mb-4 md:-mb-6 flex gap-0 bg-app-bg sm:border sm:border-app-border sm:rounded-xl sm:mx-0 sm:mb-0 shadow-sm overflow-hidden">
      {/* Mobile overlay */}
      {panelOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setPanelOpen(false)}
        />
      )}

      {/* Conversation list */}
      <div className={`
        shrink-0 transition-all duration-300 
        ${panelOpen ? 'w-64' : 'w-0'} 
        overflow-hidden
        fixed lg:relative inset-y-0 left-0 z-40 lg:z-0
        ${panelOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        h-full
      `}>
        <div className="h-full flex flex-col bg-app-surface border-r border-app-border w-64">
          <div className="p-3 border-b border-app-border space-y-2">
            <div className="flex gap-2">
              <button onClick={startNewChat} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl green-gradient text-white font-bold text-xs uppercase tracking-widest shadow-sm hover:brightness-105 transition-all">
                <Plus className="w-3.5 h-3.5" /> Baru
              </button>
              <button 
                onClick={() => setPanelOpen(false)} 
                className="p-2 rounded-xl text-app-text-secondary hover:bg-app-bg transition-all"
                title="Tutup sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-app-text-secondary/40" />
              <input
                type="text"
                value={convoSearch}
                onChange={e => setConvoSearch(e.target.value)}
                placeholder="Cari percakapan..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-app-border bg-app-bg text-app-text-primary placeholder:text-app-text-secondary/40 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 focus:outline-none transition-all"
              />
              {convoSearch && (
                <button onClick={() => setConvoSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="w-3 h-3 text-app-text-secondary/50" />
                </button>
              )}
            </div>

            {/* Select/Clear All Toolbar */}
            {conversations.length > 0 && (
              <div className="flex items-center justify-between px-1 pt-1 text-[11px] border-t border-app-border/40">
                <button 
                  onClick={toggleSelectMode}
                  className={`font-black uppercase tracking-wider transition-colors ${isSelectMode ? 'text-primary-600' : 'text-app-text-secondary hover:text-app-text-primary'}`}
                >
                  {isSelectMode ? 'Selesai' : 'Pilih'}
                </button>
                {isSelectMode ? (
                  <div className="flex gap-2">
                    <button onClick={handleSelectAll} className="text-app-text-secondary hover:text-app-text-primary font-black uppercase tracking-wider">
                      {selectedIds.size === filteredConversations.length ? 'Batal Semua' : 'Pilih Semua'}
                    </button>
                    <button 
                      onClick={() => setShowBulkDeleteConfirm(true)}
                      disabled={selectedIds.size === 0}
                      className="text-red-500 hover:text-red-600 disabled:opacity-40 font-black uppercase tracking-wider"
                    >
                      Hapus ({selectedIds.size})
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowClearConfirm(true)} 
                    className="text-red-500 hover:text-red-600 font-black uppercase tracking-wider"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto hide-scrollbar p-1.5 space-y-0.5">
            {loadingList ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-xl animate-pulse">
                    <div className="h-4 w-4 rounded bg-app-border/60 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-app-border/60 rounded w-3/4" />
                      <div className="h-2.5 bg-app-border/40 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex h-full min-h-45 items-center justify-center px-3 py-6">
                <div className="flex max-w-45 flex-col items-center gap-2 rounded-2xl border border-dashed border-app-border bg-app-bg/70 px-4 py-5 text-center">
                  <MessageSquare className="w-5 h-5 text-app-text-secondary" />
                  <p className="text-xs font-medium text-app-text-secondary">Belum ada percakapan</p>
                </div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex h-full min-h-20 items-center justify-center px-3 py-4">
                <p className="text-xs text-app-text-secondary">Tidak ditemukan</p>
              </div>
            ) : filteredConversations.map(c => {
              const isSelected = selectedIds.has(c.id);
              return (
                <div 
                  key={c.id} 
                  onClick={(e) => {
                    if (isSelectMode) {
                      handleSelectConvo(e, c.id);
                    }
                  }}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                    activeConvo?.id === c.id ? 'bg-primary-500/10 text-primary-600' : 'text-app-text-secondary hover:bg-app-bg'
                  }`}
                >
                  {isSelectMode && (
                    <button 
                      onClick={(e) => handleSelectConvo(e, c.id)}
                      className="shrink-0 text-app-text-secondary hover:text-primary-500 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary-500" />
                      ) : (
                        <Square className="w-4 h-4 opacity-40" />
                      )}
                    </button>
                  )}
                  {editingId === c.id ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave(c.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={() => handleEditSave(c.id)}
                      autoFocus
                      placeholder="Judul percakapan..."
                      className="flex-1 bg-transparent border-b border-primary-500 text-xs font-bold outline-none"
                    />
                  ) : (
                    <button 
                      onClick={() => { 
                        if (!isSelectMode) {
                          loadConversation(c); 
                          if (window.innerWidth < 1024) setPanelOpen(false); 
                        }
                      }} 
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="text-xs font-bold truncate">{c.title || 'Percakapan'}</p>
                    </button>
                  )}
                  {!isSelectMode && (
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEditStart(c); }} 
                        className="p-1 rounded text-app-text-secondary hover:bg-app-bg hover:text-primary-600 transition-all"
                        title="Edit judul"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCopy(c); }} 
                        className="p-1 rounded text-app-text-secondary hover:bg-app-bg hover:text-primary-600 transition-all"
                        title="Salin percakapan"
                      >
                        {copiedId === c.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteId(c.id); }} 
                        className="p-1 rounded text-app-text-secondary hover:bg-app-bg hover:text-red-500 transition-all"
                        title="Hapus"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-app-bg min-w-0 relative">
        {/* Top bar - always show */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-app-border bg-app-surface shrink-0">
          {!panelOpen && (
            <button 
              onClick={() => setPanelOpen(true)} 
              className="p-1.5 rounded-lg text-app-text-secondary hover:bg-app-bg transition-all"
              title="Buka sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-sm font-semibold text-app-text-primary truncate">
            {activeConvo?.title || 'Chat Baru'}
          </span>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto hide-scrollbar min-h-0 flex flex-col pb-28 sm:pb-32">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6 w-full">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
                <LottiePlayer animation="empty" className="w-36 h-36" />
                <div className="max-w-md space-y-2 -mt-2">
                  <h3 className="text-xl font-bold text-app-text-primary">Asisten AI Freshly</h3>
                  <p className="text-sm leading-relaxed text-app-text-secondary">
                    Tanyakan apa saja tentang buah, nutrisi, atau hasil scan Anda.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-lg">
                  {['Cara menyimpan alpukat?', 'Buah tinggi vitamin C?', 'Ciri mangga matang'].map(q => (
                    <button 
                      key={q} 
                      onClick={() => setInput(q)} 
                      className="px-4 py-2 rounded-xl border border-app-border text-sm font-medium text-app-text-secondary hover:bg-app-surface hover:border-primary-500/30 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <ChatMessage 
                    key={i} 
                    message={msg} 
                    onEdit={msg.role === 'user' ? (newContent) => handleEditMessage(i, newContent) : undefined}
                    isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
                  />
                ))}
                {sending && !isStreaming && (
                  <div className="flex gap-3 items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-app-surface rounded-2xl rounded-bl-md px-3 py-1 border border-app-border">
                      <LottiePlayer animation="loading" className="w-16 h-10" />
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="absolute bottom-0 inset-x-0 shrink-0 border-t border-app-border bg-app-surface shadow-[0_-10px_40px_rgba(0,0,0,0.02)] z-10 w-full">
          <div className="max-w-3xl mx-auto px-3 sm:px-6 py-3 sm:py-4 w-full">
            {/* Image Preview */}
            {(filePreview || preloadedImage) && (
              <div className="relative inline-block mb-3 bg-app-bg border border-app-border rounded-xl p-1.5 pr-8 shadow-sm">
                <img 
                  src={filePreview || resolveImageSrc(preloadedImage)} 
                  alt="Attachment preview" 
                  className="h-14 w-14 object-cover rounded-lg"
                />
                <button 
                  onClick={clearSelectedFile}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow-sm"
                  title="Hapus gambar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2 sm:gap-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-app-border bg-app-bg text-app-text-secondary hover:bg-app-surface hover:text-primary-600 active:scale-95 transition-all"
                title="Unggah gambar"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); requestAnimationFrame(autoResizeTextarea); }}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter' && !e.shiftKey) { 
                    e.preventDefault(); 
                    handleSend(); 
                  } 
                }}
                placeholder="Ketik pesan Anda..."
                rows={1}
                className="flex-1 resize-none rounded-2xl border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text-primary placeholder:text-app-text-secondary/50 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all"
                style={{ maxHeight: '120px' }}
              />
              <button 
                onClick={handleSend} 
                disabled={!input.trim() || sending} 
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl green-gradient text-white shadow-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            {/* Disclaimer */}
            <p className="hidden sm:block text-xs text-app-text-secondary/60 text-center mt-3">
              Chatbot bisa saja memberikan informasi yang salah. Mohon dicek kembali.
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Hapus Percakapan"
        message="Yakin ingin menghapus percakapan ini? Semua pesan akan hilang permanen."
        confirmText="Hapus"
        cancelText="Batal"
      />

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAll}
        title="Hapus Semua Riwayat"
        message="Yakin ingin menghapus SELURUH riwayat percakapan Anda? Tindakan ini permanen."
        confirmText="Hapus Semua"
        cancelText="Batal"
      />

      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Hapus Percakapan Terpilih"
        message={`Yakin ingin menghapus ${selectedIds.size} percakapan yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Terpilih"
        cancelText="Batal"
      />
    </div>
  );
};

export default ConversationsPage;
