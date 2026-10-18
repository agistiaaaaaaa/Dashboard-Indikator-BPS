import { useEffect, useMemo, useState } from "react";
import {
  isDevelopmentDataStore,
  listDataAudit,
  type DataChangeAuditEntry,
} from "../../data-management";
import { useDataStoreRevision } from "../../hooks/useDataStoreRevision";
import { formatNumber } from "../../utils/format";

const ACTION_LABELS: Record<string, string> = {
  CREATE_DRAFT: "Buat draft",
  UPDATE_DRAFT: "Perbarui draft",
  SUBMIT: "Ajukan review",
  SUBMIT_FOR_REVIEW: "Ajukan review",
  DELETE_DRAFT: "Hapus draft",
  APPROVE: "Setujui",
  REJECT: "Tolak",
  PUBLISH: "Publikasikan",
};

export function RiwayatAuditPage() {
  const revision = useDataStoreRevision();
  const [audits, setAudits] = useState<DataChangeAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [actorFilter, setActorFilter] = useState("ALL");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listDataAudit().then((list) => {
      if (!cancelled) {
        setAudits(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [revision]);

  const actors = useMemo(() => {
    const names = [...new Set(audits.map((a) => a.actorName))];
    return names.sort((a, b) => a.localeCompare(b, "id"));
  }, [audits]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return audits.filter((a) => {
      if (actionFilter !== "ALL" && a.action !== actionFilter) return false;
      if (actorFilter !== "ALL" && a.actorName !== actorFilter) return false;
      if (!q) return true;
      return (
        a.indicatorId.toLowerCase().includes(q) ||
        a.period.toLowerCase().includes(q) ||
        a.actorName.toLowerCase().includes(q) ||
        (a.note ?? "").toLowerCase().includes(q)
      );
    });
  }, [audits, actionFilter, actorFilter, query]);

  return (
    <section className="workspace-panel">
      <p className="eyebrow">Riwayat</p>
      <h1>Jejak audit perubahan</h1>
      <p className="workspace-lede">
        Catatan append-only untuk aksi workflow. Data pengembangan dari sesi
        browser; bukan arsip produksi BPS.
      </p>

      {isDevelopmentDataStore() ? (
        <p className="workspace-dev-banner" role="note">
          Riwayat sesi ini hilang saat tab ditutup. Tidak ada tombol hapus
          riwayat.
        </p>
      ) : null}

      <div className="ws-toolbar ws-toolbar-wrap">
        <label className="field">
          <span className="field-label">Cari</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Indikator, periode, catatan…"
          />
        </label>
        <label className="field">
          <span className="field-label">Aksi</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="ALL">Semua</option>
            {Object.keys(ACTION_LABELS).map((key) => (
              <option key={key} value={key}>
                {ACTION_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Pelaku</span>
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
          >
            <option value="ALL">Semua</option>
            {actors.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="workspace-placeholder-box">
          <p>Memuat riwayat…</p>
        </div>
      ) : !filtered.length ? (
        <div className="workspace-placeholder-box">
          <p>Belum ada jejak audit di sesi ini.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Aksi</th>
                <th>Indikator / Periode</th>
                <th>Pelaku</th>
                <th className="num">Lama</th>
                <th className="num">Baru</th>
                <th>Status</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.occurredAt).toLocaleString("id-ID")}</td>
                  <td>{ACTION_LABELS[a.action] ?? a.action}</td>
                  <td>
                    {a.indicatorId}
                    <br />
                    <span className="muted">{a.period}</span>
                  </td>
                  <td>
                    {a.actorName}
                    <br />
                    <span className="muted">{a.actorRole}</span>
                  </td>
                  <td className="num">
                    {a.previousValue === null ? "" : formatNumber(a.previousValue)}
                  </td>
                  <td className="num">
                    {a.newValue === null ? "Kosong" : formatNumber(a.newValue)}
                  </td>
                  <td>
                    {a.previousStatus ?? "baru"} ke {a.newStatus}
                  </td>
                  <td>{a.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
