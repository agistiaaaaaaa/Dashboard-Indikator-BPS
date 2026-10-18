interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Data belum dapat dimuat.",
  description = "Pastikan API lokal berjalan (biasanya http://localhost:4000), periksa koneksi, lalu coba lagi.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="state-box state-error" role="alert">
      <p className="state-title">{title}</p>
      <p className="state-desc">{description}</p>
      {onRetry ? (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}
