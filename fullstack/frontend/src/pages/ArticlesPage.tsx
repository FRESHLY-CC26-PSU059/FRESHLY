import { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { toast } from 'sonner';
import { Table, SearchInput, ActionButtonGroup, Modal, Input, FormSelect } from '../components/ui';
const TiptapEditor = lazy(() => import('../components/ui/TiptapEditor').then(mod => ({ default: mod.TiptapEditor })));
import { BookOpen, Plus, Image as ImageIcon, X, Sparkles } from 'lucide-react';
import api from '../api/axios';
import { ARTICLE_CATEGORIES, getCategoryLabel, getCategoryColor } from '../constants/categories';
import useSEO from '../hooks/useSEO';
import '../styles/tiptap.css';

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  published: boolean;
  createdAt: string;
}

const emptyForm = { title: '', content: '', excerpt: '', category: '', published: false };

const ArticlesPage = () => {
  useSEO({
    title: 'Kelola Artikel',
    description: 'Kelola artikel ensiklopedia, tips, dan edukasi seputar buah & sayur di Freshly.',
    robots: 'noindex, nofollow',
  });
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // AI Generation States
  const [showGenModal, setShowGenModal] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [genCategory, setGenCategory] = useState('');
  const [genModel, setGenModel] = useState('');
  const [generating, setGenerating] = useState(false);
  const [availableModels, setAvailableModels] = useState<{ id: string; label: string; description: string }[]>([]);
  const [defaultModel, setDefaultModel] = useState('');

  const openGenerateModal = () => {
    setGenTopic('');
    setGenCategory('');
    setShowGenModal(false);
    setTimeout(() => setShowGenModal(true), 50);
    // Fetch available models on first open
    if (availableModels.length === 0) {
      api.get('/articles/models').then((res) => {
        setAvailableModels(res.data.data.models || []);
        setDefaultModel(res.data.data.default || '');
        setGenModel(res.data.data.default || '');
      }).catch(() => {});
    } else {
      setGenModel(genModel || defaultModel);
    }
  };

  const closeGenerateModal = () => {
    setShowGenModal(false);
    setGenTopic('');
    setGenCategory('');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTopic.trim()) {
      toast.error('Topik artikel tidak boleh kosong');
      return;
    }
    try {
      setGenerating(true);
      const res = await api.post('/articles/generate', {
        topic: genTopic,
        category: genCategory || undefined,
        model: genModel || undefined,
      });
      
      const generated = res.data.data;
      
      setFormData({
        title: generated.title || '',
        content: generated.content || '',
        excerpt: generated.excerpt || '',
        category: generated.category || '',
        published: false,
      });
      
      setImagePreview(generated.image_url || null);
      setImageFile(null);
      setEditingId(null);
      
      closeGenerateModal();
      setShowModal(true);
      toast.success('Artikel berhasil di-generate oleh AI');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal men-generate artikel');
    } finally {
      setGenerating(false);
    }
  };

  const fetchArticles = useCallback(async (search = '') => {
    try {
      setLoading(true);
      const params: Record<string, string> = { published: 'all' };
      if (search) params.search = search;
      const res = await api.get('/articles', { params });
      setArticles(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat artikel');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced backend search.
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchArticles(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchArticles]);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEdit = async (id: number) => {
    try {
      setFormLoading(true);
      setEditingId(id);
      setShowModal(true);
      setImageFile(null);
      const res = await api.get(`/articles/id/${id}`);
      const a = res.data.data.article;
      setFormData({
        title: a.title || '',
        content: a.content || '',
        excerpt: a.excerpt || '',
        category: a.category || '',
        published: a.published ?? false,
      });
      setImagePreview(a.image_url || null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat artikel');
      setShowModal(false);
      setEditingId(null);
    } finally {
      setFormLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyForm);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar yang diperbolehkan');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      toast.error('Konten artikel tidak boleh kosong');
      return;
    }
    try {
      // Multipart so the optional image goes through multer.single.
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('content', formData.content);
      if (formData.excerpt) payload.append('excerpt', formData.excerpt);
      if (formData.category) payload.append('category', formData.category);
      payload.append('published', String(formData.published));
      
      if (imageFile) {
        payload.append('image', imageFile);
      } else {
        payload.append('image_url', imagePreview || '');
      }

      const config = { headers: { 'Content-Type': 'multipart/form-data' } };

      if (editingId) {
        await api.put(`/articles/${editingId}`, payload, config);
        toast.success('Artikel berhasil diperbarui');
      } else {
        await api.post('/articles', payload, config);
        toast.success('Artikel berhasil dibuat');
      }
      closeModal();
      fetchArticles(searchTerm.trim());
    } catch (err: any) {
      toast.error(err.response?.data?.message || (editingId ? 'Gagal memperbarui artikel' : 'Gagal membuat artikel'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/articles/${id}`);
      toast.success('Artikel berhasil dihapus');
      fetchArticles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus artikel');
    }
  };

  const filtered = articles.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const columns = [
    {
      key: 'title' as const,
      label: 'Judul',
      render: (_: string, row: Article) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600"><BookOpen className="w-4 h-4" /></div>
          <div className="min-w-0">
            <p className="font-bold text-app-text-primary truncate max-w-[250px]">{row.title}</p>
            <p className="text-[10px] text-app-text-secondary truncate max-w-[250px]">{row.excerpt || '-'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category' as const,
      label: 'Kategori',
      render: (val: string) => (
        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getCategoryColor(val)}`}>
          {getCategoryLabel(val) || '-'}
        </span>
      ),
    },
    {
      key: 'published' as const,
      label: 'Status',
      render: (val: boolean) => (
        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${val ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
          {val ? 'Terbit' : 'Draft'}
        </span>
      ),
    },
    {
      key: 'createdAt' as const,
      label: 'Tanggal',
      render: (val: string) => <span className="text-xs font-bold text-app-text-secondary">{new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>,
    },
    {
      key: 'actions' as const,
      label: 'Aksi',
      className: 'w-10',
      render: (_: any, row: Article) => (
        <ActionButtonGroup onEdit={() => openEdit(row.id)} onDelete={async () => handleDelete(row.id)} showView={false} showEdit showDelete size="sm" />
      ),
    },
  ];

  return (
    <div className="space-y-4 pt-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput placeholder="Cari artikel..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <div className="flex gap-2 sm:shrink-0 sm:w-auto w-full">
          <button type="button" onClick={openGenerateModal} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/15 hover:brightness-105 active:scale-95 transition-all">
            <Sparkles size={16} /> Generate AI
          </button>
          <button type="button" onClick={openCreate} className="flex-1 sm:flex-none flex items-center justify-center gap-2 green-gradient text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/10 hover:brightness-105 active:scale-95 transition-all">
            <Plus size={16} /> Tambah Artikel
          </button>
        </div>
      </div>

      <div className="bg-app-surface border border-app-border rounded-[1.5rem] overflow-hidden premium-shadow">
        <Table data={filtered} columns={columns} loading={loading} showIndex emptyMessage="Belum ada artikel" className="border-none" />
      </div>

      <Modal isOpen={showModal} onClose={closeModal} title={editingId ? 'Edit Artikel' : 'Tambah Artikel'} maxWidth="max-w-4xl" actions={
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={closeModal} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-app-bg text-app-text-secondary font-bold border border-app-border">Batal</button>
          <button form="article-form" type="submit" className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl green-gradient text-white font-bold shadow-lg shadow-emerald-500/20">
            {editingId ? 'Simpan Perubahan' : 'Publikasikan'}
          </button>
        </div>
      }>
        {formLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
        ) : (
          <form id="article-form" onSubmit={handleSubmit} className="space-y-4 py-2">
            <Input label="Judul Artikel" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required placeholder="Masukkan judul artikel..." />
            <Input label="Ringkasan (Excerpt)" value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} placeholder="Ringkasan singkat artikel..." />

            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-app-text-secondary opacity-60 mb-1.5 ml-1">Gambar Utama</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-app-bg border border-app-border text-xs font-bold text-app-text-primary hover:brightness-95 transition-all"
                >
                  <ImageIcon className="w-4 h-4" />
                  {imagePreview ? 'Ganti Gambar' : 'Pilih Gambar'}
                </button>
                {imagePreview && (
                  <>
                    <img src={imagePreview} alt="Preview" className="h-12 w-12 rounded-lg object-cover border border-app-border" />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-red-600 hover:bg-red-500/10 text-xs font-bold"
                    >
                      <X className="w-3 h-3" /> Hapus
                    </button>
                  </>
                )}
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImagePick}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormSelect 
                label="Kategori" 
                value={formData.category} 
                onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                options={ARTICLE_CATEGORIES.map(cat => ({ value: cat.value, label: `${cat.icon} ${cat.label}` }))} 
                placeholder="Pilih kategori" 
              />
              <div className="flex items-end pb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.published} onChange={(e) => setFormData({ ...formData, published: e.target.checked })} className="h-4 w-4 rounded border-app-border text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-sm font-bold text-app-text-primary">{editingId ? 'Terbitkan' : 'Langsung terbitkan'}</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-app-text-secondary opacity-60 mb-1.5 ml-1">Konten Artikel</label>
              <Suspense fallback={<div className="h-64 rounded-xl border border-app-border bg-app-bg animate-pulse" />}>
                <TiptapEditor 
                  value={formData.content} 
                  onChange={(val) => setFormData({ ...formData, content: val })}
                  placeholder="Tulis konten artikel di sini..."
                />
              </Suspense>
            </div>
          </form>
        )}
      </Modal>

      <Modal 
        isOpen={showGenModal} 
        onClose={generating ? () => {} : closeGenerateModal} 
        title="Generate Artikel dengan AI" 
        maxWidth="max-w-lg" 
        actions={
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              type="button"
              onClick={closeGenerateModal} 
              disabled={generating} 
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-app-bg text-app-text-secondary font-bold border border-app-border disabled:opacity-50"
            >
              Batal
            </button>
            <button 
              form="generate-form" 
              type="submit" 
              disabled={generating} 
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Generate
                </>
              )}
            </button>
          </div>
        }
      >
        <form id="generate-form" onSubmit={handleGenerate} className="space-y-4 py-2">
          <Input 
            label="Topik Artikel" 
            value={genTopic} 
            onChange={(e) => setGenTopic(e.target.value)} 
            required 
            placeholder="Contoh: Khasiat jus apel untuk detoksifikasi..." 
            disabled={generating}
          />
          <FormSelect 
            label="Kategori (Opsional)" 
            value={genCategory} 
            onChange={(e) => setGenCategory(e.target.value)} 
            options={ARTICLE_CATEGORIES.map(cat => ({ value: cat.value, label: `${cat.icon} ${cat.label}` }))} 
            placeholder="Pilih kategori" 
            disabled={generating}
          />

          {/* Model Selector */}
          {availableModels.length > 0 && (
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-app-text-secondary opacity-60 mb-2 ml-1">
                Model Gemini
              </label>
              <div className="grid grid-cols-1 gap-2">
                {availableModels.map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      genModel === m.id
                        ? 'border-violet-500 bg-violet-500/10 shadow-sm shadow-violet-500/10'
                        : 'border-app-border bg-app-bg hover:border-violet-400/40'
                    } ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="gemini-model"
                      value={m.id}
                      checked={genModel === m.id}
                      onChange={() => !generating && setGenModel(m.id)}
                      disabled={generating}
                      className="mt-0.5 accent-violet-600 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${
                        genModel === m.id ? 'text-violet-600' : 'text-app-text-primary'
                      }`}>
                        {m.label}
                        {m.id === defaultModel && (
                          <span className="ml-2 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-500">
                            default
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-app-text-secondary mt-0.5 opacity-70">{m.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-app-text-secondary opacity-70">
            * AI akan men-generate judul, excerpt, konten lengkap (HTML), dan gambar pendamping menggunakan model yang dipilih.
          </p>
        </form>
      </Modal>
    </div>
  );
};

export default ArticlesPage;
