import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  DATA_CHANGE_STATUS_LABELS,
  listDataChanges,
  type IndicatorValueChange,
} from "../../data-management";
import {
  formatIndicatorValue,
  resolveDisplayUnit,
} from "../../utils/format";
import {
  getIndicatorValueAtPeriod,
  getIndicators,
  searchIndicators,
} from "../../services/indicatorService";
import { useDataStoreRevision } from "../../hooks/useDataStoreRevision";

export function IndikatorInventoryPage() {
  const [query, setQuery] = useState("");
  const [changes, setChanges] = useState<IndicatorValueChange[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const revision = useDataStoreRevision();
  const indicators = useMemo(() => getIndicators(), [revision]);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    void listDataChanges()
      .then((list) => {
        if (!cancelled) setChanges(list);
      })
      .catch(() => {
        if (!cancelled) {
          setChanges([]);
          setLoadError("Gagal memuat status pengajuan. Coba muat ulang.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [revision]);

  const filtered = useMemo(
    () => searchIndicators(query, indicators),
    [query, indicators]
  );

  const latestByIndicator = useMemo(() => {
    const map = new Map<string, IndicatorValueChange>();
    for (const c of changes) {
      const prev = map.get(c.indicatorId);
      if (!prev || c.createdAt > prev.createdAt) map.set(c.indicatorId, c);
    }
    return map;
  }, [changes]);

  return (
    <section className="workspace-panel">
      <p className="eyebrow">Indikator</p>
      <h1>Inventaris indikator</h1>
      <p className="workspace-lede">
        Daftar indikator dari database (API lokal). Kolom status menampilkan
        perubahan workflow terbaru (jika ada).
      </p>

      {loadError ? (
        <p className="form-alert" role="alert">
          {loadError}
        </p>
      ) : null}

      <label className="field" style={{ maxWidth: "28rem" }}>
        <span className="field-label">Cari</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nama atau kategori…"
        />
      </label>

      <div className="table-wrap" style={{ marginTop: "1rem" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Indikator</th>
              <th>Kategori</th>
              <th className="num">Nilai terbaru</th>
              <th>Satuan</th>
              <th>Status workflow</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((ind) => {
              const point = getIndicatorValueAtPeriod(ind, null);
              const unit = resolveDisplayUnit(ind);
              const wf = latestByIndicator.get(ind.id);
              return (
                <tr key={ind.id}>
                  <td>{ind.name}</td>
                  <td>
                    <span className="chip">{ind.category}</span>
                  </td>
                  <td className="num">
                    {point ? formatIndicatorValue(ind, point) : ""}
                  </td>
                  <td>{unit ?? ""}</td>
                  <td>
                    {wf ? (
                      <span className={`ws-status status-${wf.status.toLowerCase()}`}>
                        {DATA_CHANGE_STATUS_LABELS[wf.status]}
                      </span>
                    ) : (
                      <span className="muted">Tidak ada pengajuan</span>
                    )}
                  </td>
                  <td className="actions-col">
                    <Link
                      className="btn btn-soft"
                      to={`/workspace/pemutakhiran?indicator=${encodeURIComponent(ind.id)}`}
                    >
                      Mutakhirkan
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
