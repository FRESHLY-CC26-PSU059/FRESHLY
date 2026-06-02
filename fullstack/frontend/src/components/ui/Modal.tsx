import { X } from 'lucide-react';
import { Backdrop } from '@mui/material';
import { AnimateGrow } from './Transitions';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'max-w-2xl',
  showHeader = true,
  showFooter = true,
}: ModalProps) {
  return (
    <>
      {/* Backdrop with Blur - Handled separately to avoid z-index nesting issues */}
      <Backdrop
        open={isOpen}
        onClick={onClose}
        sx={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.4)', 
          backdropFilter: 'blur(8px)',
          zIndex: 40 
        }}
      />

      <div 
        className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Modal Content with Separated Transition Component */}
        <AnimateGrow show={isOpen}>
          <div className={`w-full ${maxWidth} rounded-t-2xl sm:rounded-2xl border border-app-border bg-app-surface shadow-2xl overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col`}>
            {/* Header */}
            {showHeader && (
              <div className="flex items-center justify-between border-b border-app-border p-4 sm:p-6 bg-app-bg/20">
                <h2 className="text-lg sm:text-2xl font-bold text-app-text-primary uppercase tracking-tight">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl p-2 text-app-text-secondary hover:bg-app-bg hover:text-app-text-primary transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 hide-scrollbar">
              {children}
            </div>

            {/* Footer/Actions */}
            {showFooter && (
              <div className="flex justify-end gap-3 border-t border-app-border p-4 sm:p-6 bg-app-bg/10 shrink-0">
                {actions || (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 rounded-xl bg-app-bg text-app-text-primary font-bold hover:brightness-110 transition-all border border-app-border"
                  >
                    Tutup
                  </button>
                )}
              </div>
            )}
          </div>
        </AnimateGrow>
      </div>
    </>
  );
}
