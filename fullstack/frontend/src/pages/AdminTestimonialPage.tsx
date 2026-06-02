import { useEffect, useState } from 'react';
import { Eye, EyeOff, Trash2, Search, Star } from 'lucide-react';
import { toast } from 'sonner';
import testimonialApi, { type TestimonialData } from '../services/testimonials';
import Table from '../components/ui/Table';
import useSEO from '../hooks/useSEO';

const AdminTestimonialPage = () => {
  useSEO({
    title: 'Kelola Testimoni',
    description: 'Kelola testimoni pengguna untuk platform Freshly.',
    robots: 'noindex, nofollow',
  });

  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDisplay, setFilterDisplay] = useState<'all' | 'true' | 'false'>('all');
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTestimonials = async (p = 1, size = pageSize) => {
    setLoading(true);
    try {
      const displayFilter = filterDisplay === 'all' ? undefined : filterDisplay;
      const response = await testimonialApi.getAll(p, size, displayFilter);
      let filtered = response.data.data.testimonials;

      if (searchQuery) {
        filtered = filtered.filter(
          (t: TestimonialData) =>
            t.user?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.user?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.message?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setTestimonials(filtered);
      setTotalItems(response.data.data.pagination.total);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error: any) {
      toast.error('Gagal memuat testimoni');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials(page, pageSize);
  }, [page, pageSize, filterDisplay]);

  const handleToggleDisplay = async (id: number, currentStatus: boolean) => {
    try {
      await testimonialApi.updateDisplay(id, !currentStatus);
      toast.success('Status ditampilkan diperbarui');
      fetchTestimonials(page, pageSize);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus testimoni ini?')) return;
    try {
      await testimonialApi.delete(id);
      toast.success('Testimoni dihapus');
      fetchTestimonials(page, pageSize);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus');
    }
  };

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (_: any, testimonial: TestimonialData) => (
        <div className="text-sm">
          <p className="font-medium text-app-text-primary">
            {testimonial.user?.first_name} {testimonial.user?.last_name}
          </p>
          <p className="text-xs text-app-text-secondary">{testimonial.user?.id}</p>
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (rating: number) => (
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              className={`${
                i < (rating || 0)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-app-text-secondary/20'
              }`}
            />
          ))}
        </div>
      ),
    },
    {
      key: 'message',
      label: 'Testimoni',
      className: 'max-w-md',
      render: (message: string) => (
        <p className="text-sm text-app-text-primary line-clamp-2">{message}</p>
      ),
    },
    {
      key: 'is_displayed',
      label: 'Status',
      render: (isDisplayed: boolean) => (
        <span
          className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
            isDisplayed
              ? 'bg-green-500/10 text-green-600 border border-green-500/20'
              : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
          }`}
        >
          {isDisplayed ? 'Ditampilkan' : 'Tersembunyi'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      className: 'w-24 text-right',
      render: (_: any, testimonial: TestimonialData) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => handleToggleDisplay(testimonial.id!, testimonial.is_displayed!)}
            className="p-2 hover:bg-app-bg rounded-xl transition-all active:scale-90"
            title={testimonial.is_displayed ? 'Sembunyikan' : 'Tampilkan'}
          >
            {testimonial.is_displayed ? (
              <Eye size={18} className="text-green-600" />
            ) : (
              <EyeOff size={18} className="text-yellow-600" />
            )}
          </button>
          <button
            onClick={() => handleDelete(testimonial.id!)}
            className="p-2 hover:bg-red-500/10 rounded-xl transition-all active:scale-90 group/btn"
            title="Hapus"
          >
            <Trash2 size={18} className="text-red-500 group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-app-text-primary tracking-tight">Kelola Testimoni</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-secondary group-focus-within:text-primary-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau testimoni..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-app-surface border border-app-border rounded-2xl text-app-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-bold placeholder:font-medium"
          />
        </div>

        <div className="flex gap-4">
          <div className="relative group min-w-[160px]">
            <select
              value={filterDisplay}
              onChange={(e) => setFilterDisplay(e.target.value as 'all' | 'true' | 'false')}
              className="w-full appearance-none pl-4 pr-10 py-3 bg-app-surface border border-app-border rounded-2xl text-app-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-bold cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="true">Ditampilkan</option>
              <option value="false">Tersembunyi</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-app-text-secondary transition-transform group-focus-within:rotate-180">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Reusable Table */}
      <Table<TestimonialData & { id: number }>
        data={testimonials as (TestimonialData & { id: number })[]}
        columns={columns}
        loading={loading}
        emptyMessage="Tidak ada testimoni yang ditemukan"
        showIndex
        pagination={{
          currentPage: page,
          totalPages: totalPages,
          totalItems: totalItems,
          pageSize: pageSize,
          onPageChange: (p) => setPage(p),
          onPageSizeChange: (s) => {
            setPageSize(s);
            setPage(1);
          },
        }}
      />
    </div>
  );
};

export default AdminTestimonialPage;
