import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth";
import { ConfirmDialog } from "../../components/workspace/ConfirmDialog";
import { ValueComparison } from "../../components/workspace/ValueComparison";
import {
  DATA_CHANGE_STATUSES,
  DATA_CHANGE_STATUS_LABELS,
  isDevelopmentDataStore,
  listDataChanges,
  reviewDataChange,
  type IndicatorValueChange,
} from "../../data-management";
import { useDataStoreRevision } from "../../hooks/useDataStoreRevision";
import { getIndicator } from "../../services/indicatorService";
import { toActor } from "./workspaceUtils";

export function ReviewPersetujuanPage() {
  const { user } = useAuth();
  const revision = useDataStoreRevision();
  const [items, setItems] = useState<IndicatorValueChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"APPROVE" | "REJECT" | null>(null);
  const [query, setQuery] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listDataChanges({
        status: DATA_CHANGE_STATUSES.PENDING_REVIEW,
      });
      setItems(list);
      setSelectedId((prev) =>
        prev && list.some((c) => c.id === prev) ? prev : list[0]?.id ?? null
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, revision]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (c) =>
        c.indicatorName.toLowerCase().includes(q) ||
        c.period.toLowerCase().includes(q) ||
        c.createdByName.toLowerCase().includes(q)
    );
  }, [items, query]);

  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;
  const category = selected
    ? getIndicator(selected.indicatorId)?.category ?? ""
    : "";

  if (!user) return null;
  const actor = toActor(user);

  async function runDecision(decision: "APPROVE" | "REJECT") {
    if (!selected) return;
    if (decision === "REJECT" && !rejectNote.trim()) {
      setError("Alasan penolakan wajib diisi.");
      setConfirm(null);
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await reviewDataChange(
        {
          changeId: selected.id,
          decision,
          reviewNote: rejectNote.trim() || null,
        },
        actor
      );
      setMessage(
        decision === "APPROVE"
          ? isDevelopmentDataStore()
            ? "Disetujui dan dipublikasikan (overlay sesi pengembangan)."
            : "Disetujui dan dipublikasikan ke dashboard publik."
          : "Pengajuan ditolak. Operator dapat merevisi dan mengajukan ulang."
      );
      setConfirm(null);
      setRejectNote("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses review.");
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="workspace-panel">
      <p className="eyebrow">Review / Persetujuan</p>
      <h1>Pusat review</h1>
      <p className="workspace-lede">
        Bandingkan nilai saat ini dan nilai usulan sebelum memutuskan. Hanya
        status PUBLISHED yang memengaruhi dashboard publik.
      </p>

      {isDevelopmentDataStore() ? (
        <p className="workspace-dev-banner" role="note">
          Simulasi pengembangan: publish tidak menulis indicators.json.
        </p>
      ) : null}

      <p className="ws-pending-count" role="status">
        Menunggu review: <strong>{items.length}</strong>
      </p>

      {error ? (
        <p className="login-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="ws-success" role="status">
          {message}
        </p>
      ) : null}

      {loading ? (
        <div className="workspace-placeholder-box">
          <p>Memuat antrian…</p>
        </div>
      ) : !items.length ? (
        <div className="workspace-placeholder-box">
          <p>Belum ada perubahan yang menunggu review.</p>
        </div>
      ) : (
        <div className="ws-review-layout">
          <aside className="ws-review-queue" aria-label="Antrian pengajuan">
            <label className="field">
              <span className="field-label">Cari</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Indikator, periode, pengaju…"
              />
            </label>
            <ul className="ws-review-queue-list">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={
                      selected?.id === c.id
                        ? "ws-queue-item active"
                        : "ws-queue-item"
                    }
                    onClick={() => {
                      setSelectedId(c.id);
                      setRejectNote("");
                      setError(null);
                    }}
                  >
                    <strong>{c.indicatorName}</strong>
                    <span>
                      {c.period} · {c.createdByName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {selected ? (
            <article className="ws-card ws-review-detail">
              <header className="ws-review-detail-head">
                <div>
                  <h2 className="ws-card-title">{selected.indicatorName}</h2>
                  <p className="muted">
                    {category ? `${category} · ` : ""}
                    {selected.period}
                  </p>
                </div>
                <span
                  className={`ws-status status-${selected.status.toLowerCase()}`}
                >
                  {DATA_CHANGE_STATUS_LABELS[selected.status]}
                </span>
              </header>

              <ValueComparison
                previousValue={selected.previousValue}
                previousDisplay={selected.previousDisplay}
                proposedValue={selected.proposedValue}
                proposedDisplay={selected.proposedDisplay}
                unit={selected.unit}
              />

              <dl className="ws-dl">
                <div>
                  <dt>Sumber Data</dt>
                  <dd>{selected.sourceNote ?? "—"}</dd>
                </div>
                <div>
                  <dt>Catatan Pemutakhiran</dt>
                  <dd>{selected.changeNote ?? "—"}</dd>
                </div>
                <div>
                  <dt>Diajukan oleh</dt>
                  <dd>
                    {selected.createdByName}
                    {selected.submittedAt
                      ? ` · ${new Date(selected.submittedAt).toLocaleString("id-ID")}`
                      : ""}
                  </dd>
                </div>
              </dl>

              <label className="field">
                <span className="field-label">Alasan penolakan (wajib jika menolak)</span>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  rows={3}
                  disabled={busy}
                  placeholder="Jelaskan alasan penolakan untuk Operator"
                />
              </label>

              <div className="home-cta-row">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={busy}
                  onClick={() => {
                    if (!rejectNote.trim()) {
                      setError("Alasan penolakan wajib diisi.");
                      return;
                    }
                    setConfirm("REJECT");
                  }}
                >
                  Tolak
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() => setConfirm("APPROVE")}
                >
                  Setujui & Publish
                </button>
              </div>
            </article>
          ) : (
            <div className="workspace-placeholder-box">
              <p>Tidak ada hasil pencarian.</p>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirm === "APPROVE"}
        title="Setujui perubahan ini?"
        description={
          isDevelopmentDataStore()
            ? "Setelah disetujui, nilai usulan menjadi PUBLISHED pada overlay sesi pengembangan dan dapat tampil di dashboard publik."
            : "Setelah disetujui, nilai usulan dipublikasikan ke database dan langsung tampil di dashboard publik."
        }
        confirmLabel="Setujui & Publish"
        cancelLabel="Batalkan"
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runDecision("APPROVE")}
      >
        {selected ? (
          <ValueComparison
            previousValue={selected.previousValue}
            previousDisplay={selected.previousDisplay}
            proposedValue={selected.proposedValue}
            proposedDisplay={selected.proposedDisplay}
            unit={selected.unit}
          />
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm === "REJECT"}
        title="Tolak pengajuan ini?"
        description="Operator akan melihat alasan penolakan dan dapat merevisi lalu mengajukan ulang."
        confirmLabel="Tolak pengajuan"
        cancelLabel="Batalkan"
        danger
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runDecision("REJECT")}
      >
        <p className="ws-dialog-lede">
          Alasan: <strong>{rejectNote.trim()}</strong>
        </p>
      </ConfirmDialog>
    </section>
  );
}
