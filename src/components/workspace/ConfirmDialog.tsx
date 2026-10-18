import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive styling for reject/delete. */
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

/**
 * Accessible confirmation dialog for workflow actions.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Lanjutkan",
  cancelLabel = "Batalkan",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const onCancelStable = useCallback(() => {
    if (!busy) onCancel();
  }, [busy, onCancel]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => cancelRef.current?.focus(), 20);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancelStable();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancelStable]);

  if (!open) return null;

  return createPortal(
    <div className="ws-dialog-root" role="presentation">
      <button
        type="button"
        className="ws-dialog-backdrop"
        aria-label="Tutup dialog"
        onClick={onCancelStable}
        disabled={busy}
      />
      <div
        ref={panelRef}
        className="ws-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description || children ? descId : undefined}
      >
        <h2 id={titleId} className="ws-dialog-title">
          {title}
        </h2>
        <div id={descId} className="ws-dialog-body">
          {description ? <div className="ws-dialog-lede">{description}</div> : null}
          {children}
        </div>
        <div className="ws-dialog-actions">
          <button
            ref={cancelRef}
            type="button"
            className="btn btn-secondary"
            onClick={onCancelStable}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? "btn btn-danger" : "btn btn-primary"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Memproses…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
