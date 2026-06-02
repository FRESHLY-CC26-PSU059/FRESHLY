import { useState, useEffect } from 'react';
import { Star, Send, Sparkles } from 'lucide-react';
import { Modal } from './ui';
import { toast } from 'sonner';
import testimonialApi, { type TestimonialData } from '../services/testimonials';

interface TestimonialFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (testimonial: TestimonialData) => void;
  initialData?: TestimonialData;
  isEditing?: boolean;
}

const RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Sangat Buruk', color: 'text-red-500' },
  2: { label: 'Kurang Baik', color: 'text-orange-500' },
  3: { label: 'Cukup', color: 'text-amber-500' },
  4: { label: 'Bagus', color: 'text-lime-500' },
  5: { label: 'Luar Biasa!', color: 'text-emerald-500' },
};

export const TestimonialForm: React.FC<TestimonialFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  isEditing = false,
}) => {
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState(initialData?.message || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with initialData when editing
  useEffect(() => {
    if (isOpen) {
      setRating(initialData?.rating || 0);
      setMessage(initialData?.message || '');
      setHoverRating(0);
    }
  }, [isOpen, initialData]);

  const messageLength = message.length;
  const maxLength = 1000;
  const minLength = 10;
  const isMessageValid = messageLength >= minLength && messageLength <= maxLength;
  const isRatingValid = rating >= 1 && rating <= 5;
  const isFormValid = isMessageValid && isRatingValid;

  const activeRating = hoverRating || rating;
  const ratingInfo = activeRating > 0 ? RATING_LABELS[activeRating] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      let result;
      if (isEditing && initialData?.id) {
        result = await testimonialApi.update(initialData.id, { message, rating });
        toast.success('Testimoni berhasil diperbarui!');
      } else {
        result = await testimonialApi.create({ message, rating });
        toast.success('Testimoni dikirim! Menunggu persetujuan admin.');
      }

      onSuccess?.(result.data.data.testimonial);
      window.dispatchEvent(new CustomEvent('testimonial-submitted'));
      setMessage('');
      setRating(0);
      setHoverRating(0);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMessage(initialData?.message || '');
    setRating(initialData?.rating || 0);
    setHoverRating(0);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Testimoni' : 'Tulis Testimoni'}
      showFooter={false}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hero hint */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary-500/5 to-emerald-500/5 border border-primary-500/10">
          <div className="p-2 bg-primary-500/10 text-primary-600 rounded-xl shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-xs text-app-text-secondary leading-relaxed">
            {isEditing
              ? 'Perbarui penilaian dan ulasan Anda untuk Freshly.'
              : 'Ceritakan pengalaman Anda menggunakan Freshly. Testimoni Anda membantu pengguna lain!'}
          </p>
        </div>

        {/* Rating Stars */}
        <div>
          <label className="block text-xs font-black text-app-text-secondary uppercase tracking-widest mb-4">
            Penilaian
          </label>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-all duration-150 hover:scale-125 active:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-9 h-9 transition-all duration-150 ${
                      star <= activeRating
                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                        : 'text-app-border hover:text-amber-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {ratingInfo && (
              <span className={`text-sm font-black transition-all ${ratingInfo.color}`}>
                {ratingInfo.label}
              </span>
            )}
          </div>
          {!isRatingValid && rating === 0 && messageLength > 0 && (
            <p className="mt-2 text-xs text-red-500 font-medium">Pilih rating terlebih dahulu</p>
          )}
        </div>

        {/* Message Textarea */}
        <div>
          <label className="block text-xs font-black text-app-text-secondary uppercase tracking-widest mb-3">
            Ulasan Anda
          </label>
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ceritakan pengalaman Anda dengan Freshly... apa yang paling membantu? Fitur apa yang Anda sukai?"
              className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-app-bg text-app-text-primary placeholder-app-text-secondary/40 focus:outline-none transition-all text-sm leading-relaxed resize-none ${
                message.length > 0 && !isMessageValid
                  ? 'border-red-500 focus:border-red-500'
                  : rating > 0 && isRatingValid
                  ? 'border-emerald-500/30 focus:border-emerald-500/50 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)]'
                  : 'border-app-border focus:border-primary-500/50 focus:shadow-[0_0_0_3px_rgba(var(--primary-500-rgb),0.1)]'
              }`}
              rows={5}
              maxLength={maxLength}
            />
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className={`text-[10px] font-bold ${
              message.length > 0 && messageLength < minLength
                ? 'text-red-500'
                : isMessageValid
                ? 'text-emerald-600'
                : 'text-app-text-secondary/50'
            }`}>
              {messageLength < minLength && messageLength > 0
                ? `Minimal ${minLength} karakter (kurang ${minLength - messageLength})`
                : isMessageValid
                ? `✓ ${messageLength} karakter`
                : `${messageLength} / ${maxLength} karakter`}
            </span>
            {/* Progress bar */}
            <div className="w-24 h-1 rounded-full bg-app-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isMessageValid ? 'bg-emerald-500' : messageLength > 0 ? 'bg-amber-500' : 'bg-app-border'
                }`}
                style={{ width: `${Math.min((messageLength / minLength) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-app-border">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-5 py-3 rounded-xl bg-app-bg border border-app-border text-app-text-secondary font-bold text-sm hover:bg-app-border/50 transition-all disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white font-black text-sm uppercase tracking-wide shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {isEditing ? 'Perbarui' : 'Kirim'} Testimoni
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
