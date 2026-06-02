import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
  children?: React.ReactNode;
}

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin ingin melanjutkan?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  isLoading = false,
  variant = 'danger',
  children,
}: ConfirmDialogProps) => {
  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-amber-500 hover:bg-amber-600',
    info: 'bg-blue-500 hover:bg-blue-600',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
      showFooter={false}
    >
      <div className="py-4">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
            variant === 'danger' ? 'bg-red-500/10 text-red-600' :
            variant === 'warning' ? 'bg-amber-500/10 text-amber-600' :
            'bg-blue-500/10 text-blue-600'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 pt-1">
            <p className="text-sm text-app-text-primary leading-relaxed">{message}</p>
          </div>
        </div>
        {children && <div className="mt-4">{children}</div>}
      </div>

      <div className="flex gap-3 pt-4 border-t border-app-border">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 rounded-xl border border-app-border bg-app-bg text-app-text-secondary font-bold text-sm hover:bg-app-surface transition-all disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`flex-1 px-4 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all disabled:opacity-50 ${variantStyles[variant]}`}
        >
          {isLoading ? 'Memproses...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
