import { useEffect, useState } from 'react';
import { Edit2, Trash2, RefreshCw, MessageSquare, Star, Plus, Clock } from 'lucide-react';
import testimonialApi, { type TestimonialData } from '../services/testimonials';
import { TestimonialForm } from './TestimonialForm';
import { toast } from 'sonner';

interface TestimonialListProps {
  onRefresh?: () => void;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={`w-4 h-4 transition-colors ${
          s <= rating
            ? 'fill-amber-400 text-amber-400'
            : 'fill-app-border text-app-border'
        }`}
      />
    ))}
  </div>
);

const StatusBadge = ({ isDisplayed }: { isDisplayed: boolean }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
      isDisplayed
        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${isDisplayed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
    {isDisplayed ? 'Ditampilkan' : 'Menunggu'}
  </span>
);

export const TestimonialList: React.FC<TestimonialListProps> = ({ onRefresh }) => {
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialData | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const response = await testimonialApi.getUserTestimonials();
      setTestimonials(response.data.data.testimonials);
    } catch {
      toast.error('Gagal memuat testimoni');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();

    const handleTestimonialSubmitted = () => {
      fetchTestimonials();
    };

    window.addEventListener('testimonial-submitted', handleTestimonialSubmitted);
    return () => {
      window.removeEventListener('testimonial-submitted', handleTestimonialSubmitted);
    };
  }, []);

  const handleEdit = (testimonial: TestimonialData) => {
    setEditingTestimonial(testimonial);
    setFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus testimoni ini?')) return;
    setDeletingId(id);
    try {
      await testimonialApi.delete(id);
      toast.success('Testimoni berhasil dihapus');
      window.dispatchEvent(new CustomEvent('testimonial-submitted'));
      fetchTestimonials();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingTestimonial(null);
  };

  const handleFormSuccess = () => {
    fetchTestimonials();
    handleFormClose();
    onRefresh?.();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-app-text-primary tracking-tight">Testimoni Saya</h3>
            <p className="text-[10px] text-app-text-secondary font-medium">
              {testimonials.length > 0
                ? `${testimonials.length} testimoni`
                : 'Bagikan pengalaman Anda'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTestimonials}
            disabled={loading}
            className="p-2 rounded-xl bg-app-bg border border-app-border text-app-text-secondary hover:text-app-text-primary hover:border-app-accent/30 transition-all disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {testimonials.length === 0 && (
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-5 rounded-2xl border border-app-border bg-app-bg animate-pulse">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="w-4 h-4 rounded bg-app-border" />
                  ))}
                </div>
                <div className="w-20 h-5 rounded-full bg-app-border" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-app-border rounded w-full" />
                <div className="h-3 bg-app-border rounded w-4/5" />
              </div>
            </div>
          ))}
        </div>
      ) : testimonials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-app-border rounded-2xl bg-app-bg/50">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
            <Star className="w-7 h-7 text-amber-500/60" />
          </div>
          <p className="text-sm font-bold text-app-text-primary mb-1">Belum ada testimoni</p>
          <p className="text-xs text-app-text-secondary max-w-xs leading-relaxed">
            Bagikan pengalaman Anda menggunakan Freshly dan bantu pengguna lain!
          </p>
          <button
            onClick={() => setFormOpen(true)}
            className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-xs font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Tulis Testimoni Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="group relative p-5 rounded-2xl border border-app-border bg-app-bg hover:border-primary-500/30 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300"
            >
              {/* Top row: stars + status + actions */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <StarRating rating={testimonial.rating || 0} />
                  <StatusBadge isDisplayed={testimonial.is_displayed ?? false} />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleEdit(testimonial)}
                    className="p-1.5 w-7 h-7 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(testimonial.id!)}
                    disabled={deletingId === testimonial.id}
                    className="p-1.5 w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Message */}
              <p className="text-sm text-app-text-primary leading-relaxed">{testimonial.message}</p>

              {/* Footer date */}
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-app-text-secondary/60">
                <Clock className="w-3 h-3" />
                <span className="font-medium">
                  {new Date(testimonial.createdAt!).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <TestimonialForm
        isOpen={formOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        initialData={editingTestimonial || undefined}
        isEditing={!!editingTestimonial}
      />
    </div>
  );
};
