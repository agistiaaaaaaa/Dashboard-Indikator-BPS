import { exportIndicators, type IndicatorFilters } from "../../services/indicatorService";

interface ExportButtonProps {
  filters: IndicatorFilters;
  disabled?: boolean;
}

export function ExportButton({ filters, disabled }: ExportButtonProps) {
  return (
    <button
      type="button"
      className="btn btn-primary btn-export"
      disabled={disabled}
      onClick={() => exportIndicators(filters)}
      aria-label="Unduh data Excel sesuai filter aktif"
    >
      <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 3a1 1 0 0 1 1 1v8.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L11 12.6V4a1 1 0 0 1 1-1ZM5 18a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1Z"
        />
      </svg>
      <span className="btn-export-text">
        <strong>Unduh Excel</strong>
        <small>Sesuai filter yang dipilih</small>
      </span>
    </button>
  );
}
