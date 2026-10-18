import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth";
import { ConfirmDialog } from "../../components/workspace/ConfirmDialog";
import { ValueComparison } from "../../components/workspace/ValueComparison";
import {
  DATA_CHANGE_STATUS_LABELS,
  DATA_CHANGE_STATUSES,
  deleteDraftChange,
  listDataChanges,
  submitChangeForReview,
  type DataChangeStatus,
  type IndicatorValueChange,
} from "../../data-management";
import { useDataStoreRevision } from "../../hooks/useDataStoreRevision";
import { formatNumber } from "../../utils/format";
import { formatDisplayValue, toActor } from "./workspaceUtils";

export function PengajuanSayaPage() {
  const { user } = useAuth();
  const revision = useDataStoreRevision();
  const [items, setItems] = useState<IndicatorValueChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DataChangeStatus | "ALL">(
    "ALL"
  );
  const [submitTarget, setSubmitTarget] = useState<IndicatorValueChange | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<IndicatorValueChange | null>(
    null
  );

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listDataChanges({ createdByUserId: user.id });
      setItems(list);
    } catch (err) {
      setItems([]);
      setError(
        err instanceof Error ? err.message : "Gagal memuat daftar pengajuan."
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void reload();
  }, [reload, revision]);

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return items;
    return items.filter((c) => c.status === statusFilter);
  }, [items, statusFilter]);

  const actionable = items.filter(
    (c) =>
      c.status === DATA_CHANGE_STATUSES.DRAFT ||
      c.status === DATA_CHANGE_STATUSES.REJECTED
  ).length;

  if (!user) return null;
  const actor = toActor(user);

  async function confirmSubmit() {
    if (!submitTarget) return;
    setBusyId(submitTarget.id);
    setError(null);
    setMessage(null);
    try {
      await submitChangeForReview({ changeId: submitTarget.id }, actor);
      setMessage("Pengajuan dikirim ke antrian review Admin.");
      setSubmitTarget(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengajukan.");
      setSubmitTarget(null);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    setError(null);
    setMessage(null);
    try {
      await deleteDraftChange({ changeId: deleteTarget.id }, actor);
      setMessage("Draft dihapus.");
      setDeleteTarget(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus draft.");
      setDeleteTarget(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="workspace-panel">
      <p className="eyebrow">Pengajuan Saya</p>
      <h1>Draft dan pengajuan Anda</h1>
      <p className="workspace-lede">
        Pantau status usulan. Pengajuan ditolak menampilkan alasan Admin agar
        dapat direvisi di Pemutakhiran Data.
      </p>

      <p className="ws-pending-count" role="status">
        Perlu tindakan: <strong>{actionable}</strong>
      </p>

      <div className="ws-toolbar">
        <Link to="/workspace/pemutakhiran" className="btn btn-soft">
          Buat draft baru
        </Link>
        <label className="field ws-toolbar-filter">
          <span className="field-label">Status</span>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as DataChangeStatus | "ALL")
            }
          >
            <option value="ALL">Semua</option>
            <option value={DATA_CHANGE_STATUSES.DRAFT}>Draft</option>
            <option value={DATA_CHANGE_STATUSES.PENDING_REVIEW}>
              Menunggu review
            </option>
            <option value={DATA_CHANGE_STATUSES.REJECTED}>Ditolak</option>
            <option value={DATA_CHANGE_STATUSES.PUBLISHED}>
              Dipublikasikan
            </option>
          </select>
        </label>
      </div>

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
          <p>Memuat pengajuan…</p>
        </div>
      ) : !filtered.length ? (
        <div className="workspace-placeholder-box">
          <p>Belum ada draft atau pengajuan di sesi ini.</p>
        </div>
      ) : (
        <div className="ws-card-list">
          {filtered.map((c) => (
            <article key={c.id} className="ws-card ws-submission-card">
              <header className="ws-review-detail-head">
                <div>
                  <h2 className="ws-card-title">{c.indicatorName}</h2>
                  <p className="muted">Periode {c.period}</p>
                </div>
                <span className={`ws-status status-${c.status.toLowerCase()}`}>
                  {DATA_CHANGE_STATUS_LABELS[c.status]}
                </span>
              </header>

              <ValueComparison
                previousValue={c.previousValue}
                previousDisplay={c.previousDisplay}
                proposedValue={c.proposedValue}
                proposedDisplay={c.proposedDisplay}
                unit={c.unit}
              />

              <dl className="ws-dl">
                <div>
                  <dt>Diajukan</dt>
                  <dd>
                    {c.submittedAt
                      ? new Date(c.submittedAt).toLocaleString("id-ID")
                      : "Belum diajukan"}
                  </dd>
                </div>
                <div>
                  <dt>Catatan</dt>
                  <dd>{c.changeNote ?? "—"}</dd>
                </div>
                {c.status === DATA_CHANGE_STATUSES.REJECTED ? (
                  <div className="ws-span-2">
                    <dt>Alasan penolakan</dt>
                    <dd className="ws-reject-note">{c.reviewNote ?? "—"}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="home-cta-row">
                {(c.status === DATA_CHANGE_STATUSES.DRAFT ||
                  c.status === DATA_CHANGE_STATUSES.REJECTED) && (
                  <>
                    <Link
                      className="btn btn-soft"
                      to={`/workspace/pemutakhiran?indicator=${encodeURIComponent(c.indicatorId)}`}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busyId === c.id}
                      onClick={() => setSubmitTarget(c)}
                    >
                      {busyId === c.id ? "Mengirim…" : "Ajukan Review"}
                    </button>
                  </>
                )}
                {c.status === DATA_CHANGE_STATUSES.DRAFT ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={busyId === c.id}
                    onClick={() => setDeleteTarget(c)}
                  >
                    Hapus Draft
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(submitTarget)}
        title="Kirim perubahan untuk ditinjau?"
        description="Ringkasan usulan Anda."
        confirmLabel="Kirim pengajuan"
        cancelLabel="Batalkan"
        busy={busyId === submitTarget?.id}
        onCancel={() => setSubmitTarget(null)}
        onConfirm={() => void confirmSubmit()}
      >
        {submitTarget ? (
          <div className="ws-dialog-summary">
            <p>
              <strong>{submitTarget.indicatorName}</strong> · {submitTarget.period}
            </p>
            <p>
              Nilai usulan:{" "}
              {formatDisplayValue(
                submitTarget.proposedValue,
                submitTarget.proposedDisplay,
                formatNumber
              )}
            </p>
          </div>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus draft ini?"
        description="Draft yang dihapus tidak dapat dikembalikan. Jejak audit tetap tercatat."
        confirmLabel="Hapus Draft"
        cancelLabel="Batalkan"
        danger
        busy={busyId === deleteTarget?.id}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}
