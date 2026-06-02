import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Table, SearchInput, ActionButtonGroup, Modal, Input, FormSelect } from '../components/ui';
import { Database, Plus } from 'lucide-react';
import api from '../api/axios';
import useSEO from '../hooks/useSEO';

interface Knowledge {
  id: number;
  title: string;
  content: string;
  category: string;
  source: string;
  enabled: boolean;
  createdAt: string;
}

const KnowledgePage = () => {
  useSEO({
    title: 'Knowledge Base',
    description: 'Kelola basis pengetahuan (knowledge base) untuk asisten AI Freshly.',
    robots: 'noindex, nofollow',
  });

  const [items, setItems] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', category: '', source: 'manual', enabled: true });

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/knowledges', { params: { limit: 0 } });
      setItems(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memuat knowledge base');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/knowledges/${editingId}`, formData);
        toast.success('Knowledge berhasil diperbarui');
      } else {
        await api.post('/knowledges', formData);
        toast.success('Knowledge berhasil ditambahkan');
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ title: '', content: '', category: '', source: 'manual', enabled: true });
      fetchItems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan knowledge');
    }
  };

  const handleEdit = (row: Knowledge) => {
    setEditingId(row.id);
    setFormData({ title: row.title, content: row.content, category: row.category || '', source: row.source || 'manual', enabled: row.enabled });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/knowledges/${id}`);
      toast.success('Knowledge berhasil dihapus');
      fetchItems();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus knowledge');
    }
  };

  const filtered = items.filter(k => k.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const columns = [
    {
      key: 'title' as const, label: 'Judul',
      render: (_: string, row: Knowledge) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600"><Database className="w-4 h-4" /></div>
          <span className="font-bold text-app-text-primary truncate max-w-[250px]">{row.title}</span>
        </div>
      ),
    },
    {
      key: 'category' as const, label: 'Kategori',
      render: (val: string) => <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-app-bg text-app-text-secondary border-app-border">{val || '-'}</span>,
    },
    {
      key: 'source' as const, label: 'Sumber',
      render: (val: string) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${val === 'chat' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : val === 'scan' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-app-bg text-app-text-secondary border-app-border'}`}>
          {val === 'chat' ? '🤖 Auto' : val}
        </span>
      ),
    },
    {
      key: 'enabled' as const, label: 'Status',
      render: (val: boolean) => (
        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${val ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>{val ? 'Aktif' : 'Off'}</span>
      ),
    },
    {
      key: 'actions' as const, label: 'Aksi', className: 'w-10',
      render: (_: any, row: Knowledge) => (
        <ActionButtonGroup onDelete={async () => handleDelete(row.id)} onEdit={() => handleEdit(row)} showView={false} showEdit showDelete size="sm" />
      ),
    },
  ];

  return (
    <div className="space-y-4 pt-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput placeholder="Cari knowledge..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <button onClick={() => setShowModal(true)} className="flex items-center justify-center gap-2 green-gradient text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/10 hover:brightness-105 active:scale-95 transition-all sm:shrink-0 sm:w-auto w-full">
          <Plus size={16} /> Tambah Knowledge
        </button>
      </div>

      <div className="bg-app-surface border border-app-border rounded-[1.5rem] overflow-hidden premium-shadow">
        <Table data={filtered} columns={columns} loading={loading} showIndex emptyMessage="Belum ada knowledge" className="border-none" />
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingId(null); setFormData({ title: '', content: '', category: '', source: 'manual', enabled: true }); }} title={editingId ? 'Edit Knowledge' : 'Tambah Knowledge'} actions={
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={() => { setShowModal(false); setEditingId(null); setFormData({ title: '', content: '', category: '', source: 'manual', enabled: true }); }} className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-app-bg text-app-text-secondary font-bold border border-app-border">Batal</button>
          <button form="knowledge-form" type="submit" className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl green-gradient text-white font-bold shadow-lg shadow-emerald-500/20">Simpan</button>
        </div>
      }>
        <form id="knowledge-form" onSubmit={handleSubmit} className="space-y-4 py-2">
          <Input label="Judul" helperText="Judul singkat yang mendeskripsikan knowledge ini" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required placeholder="Contoh: Cara Menyimpan Apel" />
          <Input label="Kategori" helperText="Kelompokkan knowledge berdasarkan topik" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Contoh: penyimpanan, nutrisi, tips" />
          <FormSelect label="Status" helperText="Aktifkan agar bisa digunakan AI" value={String(formData.enabled)} onChange={(e) => setFormData({ ...formData, enabled: e.target.value === 'true' })} options={[
            { value: 'true', label: 'Aktif' },
            { value: 'false', label: 'Nonaktif' },
          ]} />
          <FormSelect label="Sumber" helperText="Dari mana informasi ini berasal" value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} options={[
            { value: 'manual', label: 'Input Manual' },
            { value: 'article', label: 'Dari Artikel' },
            { value: 'research', label: 'Riset/Jurnal' },
            { value: 'expert', label: 'Pakar/Ahli' },
          ]} />
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-app-text-secondary opacity-60 mb-1.5 ml-1">Konten</label>
            <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Tulis konten knowledge secara detail..." required
              className="w-full min-h-[140px] px-4 py-2.5 border border-app-border rounded-xl bg-app-surface text-app-text-primary text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all" />
            <p className="mt-1.5 text-[10px] font-medium text-app-text-secondary/60 ml-1">Tulis informasi selengkap mungkin agar AI dapat memberikan jawaban yang akurat</p>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default KnowledgePage;
