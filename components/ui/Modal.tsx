'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

/** Replaces RN <Modal> and Alert.alert() with an accessible web dialog. */
export default function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-10 w-full overflow-hidden rounded-t-3xl bg-white shadow-pop sm:rounded-3xl',
          size === 'sm' && 'sm:max-w-md',
          size === 'md' && 'sm:max-w-xl',
          size === 'lg' && 'sm:max-w-3xl',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            {title && <h3 className="text-lg font-bold text-ink">{title}</h3>}
            {description && <p className="mt-0.5 text-sm text-subtle">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-subtle transition hover:bg-canvas" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-line bg-canvas px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/** Drop-in replacement for the RN `Alert.alert(title, msg, [...])` confirm pattern. */
export function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', tone = 'primary', loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  tone?: 'primary' | 'danger';
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="h-10 rounded-xl px-4 text-sm font-semibold text-subtle hover:bg-white">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'h-10 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-60',
              tone === 'danger' ? 'bg-danger hover:bg-red-700' : 'bg-brand hover:bg-brand-dark',
            )}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-subtle">{message}</p>
    </Modal>
  );
}
