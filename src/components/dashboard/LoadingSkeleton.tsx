export function LoadingSkeleton() {
  return (
    <div className="skeleton-grid" aria-busy="true" aria-label="Memuat data">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-line w-40" />
          <div className="skeleton-line w-70 lg" />
          <div className="skeleton-line w-50" />
        </div>
      ))}
    </div>
  );
}
