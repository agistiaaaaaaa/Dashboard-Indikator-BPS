import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getIndicatorTrend,
  getIndicatorValueAtPeriod,
  searchIndicators,
  type Indicator,
} from "../../services/indicatorService";
import {
  formatValueWithUnit,
  resolveDisplayUnit,
} from "../../utils/format";

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

const MAX_RESULTS = 8;

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => {
    const q = query.trim();
    if (q.length < 1) return [] as Indicator[];
    return searchIndicators(q).slice(0, MAX_RESULTS);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
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
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  const goToIndicator = (id: string) => {
    onClose();
    navigate(`/data-strategis?detail=${encodeURIComponent(id)}`);
  };

  const onInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      goToIndicator(results[activeIndex].id);
    }
  };

  return (
    <div className="search-overlay" role="presentation">
      <button
        type="button"
        className="search-backdrop"
        aria-label="Tutup pencarian"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="search-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="search-panel-head">
          <h2 id={titleId} className="search-panel-title">
            Cari indikator
          </h2>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>

        <label className="search-field">
          <span className="visually-hidden">Kata kunci</span>
          <svg className="search-field-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4 4a1 1 0 0 1-1.4 1.4l-4-4A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z"
            />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Ketik nama atau kategori…"
            aria-label="Cari indikator strategis"
            aria-controls="global-search-results"
            autoComplete="off"
          />
        </label>

        <div id="global-search-results" className="search-results" role="listbox" aria-label="Hasil pencarian">
          {!query.trim() ? (
            <p className="search-hint">Cari di inventaris 58 indikator strategis terverifikasi.</p>
          ) : results.length === 0 ? (
            <p className="search-hint">Tidak ada indikator yang sesuai.</p>
          ) : (
            <ul className="search-result-list">
              {results.map((ind, index) => (
                <li key={ind.id}>
                  <SearchResultRow
                    indicator={ind}
                    active={index === activeIndex}
                    onSelect={() => goToIndicator(ind.id)}
                    onHover={() => setActiveIndex(index)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="search-footer-note">
          Publikasi belum dapat dicari.{" "}
          <Link to="/data-strategis" onClick={onClose}>
            Buka Data Strategis
          </Link>
        </p>
      </div>
    </div>
  );
}

function SearchResultRow({
  indicator,
  active,
  onSelect,
  onHover,
}: {
  indicator: Indicator;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const point = getIndicatorValueAtPeriod(indicator, null);
  const unit = resolveDisplayUnit(indicator);
  const valueText = point ? formatValueWithUnit(indicator, point) : "Data belum tersedia";
  const trend = getIndicatorTrend(indicator.id, null);

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      className={active ? "search-result active" : "search-result"}
      onClick={onSelect}
      onMouseEnter={onHover}
    >
      <span className="search-result-name">{indicator.name}</span>
      <span className="search-result-meta">
        {[
          indicator.category,
          valueText,
          point?.period,
          trend?.label,
          unit && !valueText.includes(unit) ? unit : null,
        ]
          .filter(Boolean)
          .join(", ")}
      </span>
      <span className="search-result-action">Lihat indikator →</span>
    </button>
  );
}
