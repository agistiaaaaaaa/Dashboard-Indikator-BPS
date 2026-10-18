import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth";
import { ConfirmDialog } from "../../components/workspace/ConfirmDialog";
import { ValueComparison } from "../../components/workspace/ValueComparison";
import {
  DATA_CHANGE_STATUS_LABELS,
  isDevelopmentDataStore,
  listDataChanges,
  saveDraftChange,
  submitChangeForReview,
  validateDraftInput,
  type IndicatorValueChange,
} from "../../data-management";
import {
  formatIndicatorValue,
  resolveDisplayUnit,
} from "../../utils/format";
import { uniqueSortedPeriods } from "../../utils/periods";
import {
  getIndicator,
  getIndicatorValueAtPeriod,
  getIndicators,
  searchIndicators,
} from "../../services/indicatorService";
import { useUnsavedChanges } from "../../workspace/UnsavedChangesContext";
import { useDataStoreRevision } from "../../hooks/useDataStoreRevision";
import { toActor } from "./workspaceUtils";

export function PemutakhiranDataPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { setDirty, requestLeave } = useUnsavedChanges();
  const [params] = useSearchParams();
  const revision = useDataStoreRevision();
  const indicators = useMemo(() => getIndicators(), [revision]);

  const initialId =
    params.get("indicator") && getIndicator(params.get("indicator")!)
      ? params.get("indicator")!
      : indicators[0]?.id ?? "";

  const [query, setQuery] = useState("");
  const [indicatorId, setIndicatorId] = useState(initialId);
  const [period, setPeriod] = useState("");
  const [valueText, setValueText] = useState("");
  const [sourceNote, setSourceNote] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastChangeId, setLastChangeId] = useState<string | null>(null);
  const [related, setRelated] = useState<IndicatorValueChange | null>(null);
  const [dirtyBaseline, setDirtyBaseline] = useState({
    valueText: "",
    sourceNote: "",
    changeNote: "",
  });
  const [submitOpen, setSubmitOpen] = useState(false);

  const filtered = useMemo(
    () => searchIndicators(query, indicators).slice(0, 40),
    [query, indicators]
  );

  const selected = indicatorId ? getIndicator(indicatorId) : undefined;
  const periods = useMemo(
    () =>
      selected
        ? uniqueSortedPeriods(selected.values.map((v) => v.period))
        : [],
    [selected]
  );

  useEffect(() => {
    if (!periods.length) return;
    if (!period || !periods.includes(period)) {
      setPeriod(periods[periods.length - 1] ?? "");
    }
  }, [periods, period]);

  const current = selected
    ? getIndicatorValueAtPeriod(selected, period || null)
    : null;
  const unit = selected ? resolveDisplayUnit(selected) : null;
  const previousValue = current?.value ?? null;

  const isDirty =
    valueText !== dirtyBaseline.valueText ||
    sourceNote !== dirtyBaseline.sourceNote ||
    changeNote !== dirtyBaseline.changeNote;

  useEffect(() => {
    setDirty("pemutakhiran", isDirty);
    return () => setDirty("pemutakhiran", false);
  }, [isDirty, setDirty]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const loadRelated = useCallback(async () => {
    if (!user || !indicatorId || !period) {
      setRelated(null);
      return;
    }
    const list = await listDataChanges({
      indicatorId,
      createdByUserId: user.id,
    });
    const match = list.find(
      (c) =>
        c.period === period &&
        (c.status === "DRAFT" ||
          c.status === "REJECTED" ||
          c.status === "PENDING_REVIEW")
    );
    setRelated(match ?? null);
    if (match && (match.status === "DRAFT" || match.status === "REJECTED")) {
      const vt =
        match.proposedValue === null
          ? ""
          : (match.proposedDisplay ?? String(match.proposedValue));
      const sn = match.sourceNote ?? "";
      const cn = match.changeNote ?? "";
      setValueText(vt);
      setSourceNote(sn);
      setChangeNote(cn);
      setDirtyBaseline({ valueText: vt, sourceNote: sn, changeNote: cn });
      setLastChangeId(match.id);
    } else if (match && match.status === "PENDING_REVIEW") {
      const vt =
        match.proposedValue === null
          ? ""
          : (match.proposedDisplay ?? String(match.proposedValue));
      const sn = match.sourceNote ?? "";
      const cn = match.changeNote ?? "";
      setValueText(vt);
      setSourceNote(sn);
      setChangeNote(cn);
      setDirtyBaseline({ valueText: vt, sourceNote: sn, changeNote: cn });
      setLastChangeId(match.id);
    } else {
      setValueText("");
      setSourceNote("");
      setChangeNote("");
      setDirtyBaseline({ valueText: "", sourceNote: "", changeNote: "" });
      setLastChangeId(null);
    }
  }, [user, indicatorId, period]);

  useEffect(() => {
    void loadRelated();
  }, [loadRelated]);

  if (!user) return null;
  const actor = toActor(user);
  const isOperator = hasRole("OPERATOR");
  const isAdmin = hasRole("ADMIN");
  const locked = related?.status === "PENDING_REVIEW";

  function requestIndicatorChange(nextId: string) {
    if (nextId === indicatorId) return;
    requestLeave(() => {
      setValueText("");
      setSourceNote("");
      setChangeNote("");
      setDirtyBaseline({ valueText: "", sourceNote: "", changeNote: "" });
      setIndicatorId(nextId);
      setMessage(null);
      setError(null);
    });
  }

  function requestPeriodChange(nextPeriod: string) {
    if (nextPeriod === period) return;
    requestLeave(() => {
      setValueText("");
      setSourceNote("");
      setChangeNote("");
      setDirtyBaseline({ valueText: "", sourceNote: "", changeNote: "" });
      setPeriod(nextPeriod);
      setMessage(null);
      setError(null);
    });
  }

  function buildValidated() {
    if (!selected || !period) {
      return { ok: false as const, error: "Pilih indikator dan periode." };
    }
    return validateDraftInput({
      indicatorId: selected.id,
      period,
      valueText,
      sourceNote,
      changeNote,
      allowedPeriods: periods,
      previousValue,
    });
  }

  async function onSaveDraft(e: FormEvent) {
    e.preventDefault();
    if (locked) return;
    const validated = buildValidated();
    if (!validated.ok) {
      setError(validated.error);
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const change = await saveDraftChange(
        {
          indicatorId: selected!.id,
          period,
          proposedValue: validated.proposedValue,
          proposedDisplay: validated.proposedDisplay,
          sourceNote,
          changeNote,
          changeId: lastChangeId,
        },
        actor
      );
      setLastChangeId(change.id);
      setDirtyBaseline({ valueText, sourceNote, changeNote });
      setRelated(change);
      setMessage("Draft tersimpan. Belum terlihat di dashboard publik.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan draft.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmSubmit() {
    if (locked || !selected) return;
    const validated = buildValidated();
    if (!validated.ok) {
      setError(validated.error);
      setSubmitOpen(false);
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const draft = await saveDraftChange(
        {
          indicatorId: selected.id,
          period,
          proposedValue: validated.proposedValue,
          proposedDisplay: validated.proposedDisplay,
          sourceNote,
          changeNote,
          changeId: lastChangeId,
        },
        actor
      );
      await submitChangeForReview({ changeId: draft.id }, actor);
      setLastChangeId(draft.id);
      setDirtyBaseline({ valueText, sourceNote, changeNote });
      setSubmitOpen(false);
      setMessage("Pengajuan dikirim. Menunggu review Administrator.");
      await loadRelated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengajukan review.");
      setSubmitOpen(false);
    } finally {
      setBusy(false);
    }
  }

  const validatedPreview = buildValidated();

  return (
    <section className="workspace-panel">
      <p className="eyebrow">Pemutakhiran Data</p>
      <h1>Perbarui nilai indikator</h1>
      <p className="workspace-lede">
        Formulir ini membuat usulan (draft), bukan mengedit dataset publik
        langsung. Nilai baru baru tampil di dashboard setelah Admin menyetujui
        dan mempublikasikan.
      </p>

      {isDevelopmentDataStore() ? (
        <p className="workspace-dev-banner" role="note">
          Mode pengembangan: draft/publish disimpan di sesi browser, bukan
          database BPS. File indicators.json tidak diubah.
        </p>
      ) : null}

      <div className="ws-grid-2">
        <div className="ws-card">
          <label className="field">
            <span className="field-label">Cari indikator</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik nama atau kategori…"
            />
          </label>
          <label className="field" style={{ marginTop: "0.75rem" }}>
            <span className="field-label">Indikator</span>
            <select
              value={indicatorId}
              onChange={(e) => requestIndicatorChange(e.target.value)}
              aria-label="Pilih indikator"
            >
              {filtered.map((ind) => (
                <option key={ind.id} value={ind.id}>
                  {ind.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field" style={{ marginTop: "0.75rem" }}>
            <span className="field-label">Periode</span>
            <select
              value={period}
              onChange={(e) => requestPeriodChange(e.target.value)}
              aria-label="Pilih periode"
            >
              {periods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          {selected ? (
            <dl className="ws-meta-dl">
              <div>
                <dt>ID indikator</dt>
                <dd>
                  <code>{selected.id}</code>
                </dd>
              </div>
              <div>
                <dt>Kategori</dt>
                <dd>{selected.category}</dd>
              </div>
              <div>
                <dt>Satuan</dt>
                <dd>{unit ?? "—"}</dd>
              </div>
              <div>
                <dt>Status workflow</dt>
                <dd>
                  {related ? (
                    <span
                      className={`ws-status status-${related.status.toLowerCase()}`}
                    >
                      {DATA_CHANGE_STATUS_LABELS[related.status]}
                    </span>
                  ) : (
                    <span className="muted">Belum ada usulan</span>
                  )}
                </dd>
              </div>
            </dl>
          ) : null}
        </div>

        <div className="ws-card">
          <h2 className="ws-card-title">Nilai Saat Ini (publik / terbit)</h2>
          <p className="ws-current-value">
            {current
              ? formatIndicatorValue(selected!, current)
              : "Data belum tersedia"}
            {unit && current?.value !== null && current ? (
              <span className="kpi-unit"> {unit}</span>
            ) : null}
          </p>
          <p className="muted">
            Periode {period || "—"}. Ini bukan nilai usulan draft.
          </p>
          {related?.status === "REJECTED" && related.reviewNote ? (
            <p className="ws-reject-note" role="status">
              Ditolak: {related.reviewNote}
            </p>
          ) : null}
          {locked ? (
            <p className="ws-reject-note" role="status">
              Pengajuan menunggu review. Tidak dapat diedit sampai Admin
              memutuskan.
            </p>
          ) : null}
        </div>
      </div>

      <form className="ws-form" onSubmit={onSaveDraft}>
        <h2 className="ws-card-title">Nilai Usulan (draft)</h2>
        <label className="field">
          <span className="field-label">
            Nilai Usulan (kosongkan = nilai kosong, bukan nol)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={valueText}
            onChange={(e) => setValueText(e.target.value)}
            placeholder="Contoh: 1.129,78"
            disabled={busy || locked}
            aria-invalid={error ? true : undefined}
          />
        </label>
        <label className="field">
          <span className="field-label">Sumber Data</span>
          <input
            type="text"
            value={sourceNote}
            onChange={(e) => setSourceNote(e.target.value)}
            placeholder="Sumber / referensi resmi"
            disabled={busy || locked}
          />
        </label>
        <label className="field">
          <span className="field-label">Catatan Pemutakhiran</span>
          <textarea
            value={changeNote}
            onChange={(e) => setChangeNote(e.target.value)}
            rows={3}
            placeholder="Alasan atau konteks perubahan"
            disabled={busy || locked}
          />
        </label>

        {error ? (
          <p className="login-error" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="ws-success" role="status">
            {message}
            {lastChangeId && isOperator ? (
              <>
                {" "}
                <Link
                  to="/workspace/pengajuan"
                  onClick={(e) => {
                    if (!isDirty) return;
                    e.preventDefault();
                    requestLeave(() => navigate("/workspace/pengajuan"));
                  }}
                >
                  Buka Pengajuan Saya
                </Link>
              </>
            ) : null}
            {lastChangeId && isAdmin ? (
              <>
                {" "}
                <Link
                  to="/workspace/review"
                  onClick={(e) => {
                    if (!isDirty) return;
                    e.preventDefault();
                    requestLeave(() => navigate("/workspace/review"));
                  }}
                >
                  Buka Review
                </Link>
              </>
            ) : null}
          </p>
        ) : null}

        <div className="home-cta-row">
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={busy || locked}
          >
            {busy ? "Menyimpan…" : "Simpan Draft"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || locked}
            onClick={() => {
              const v = buildValidated();
              if (!v.ok) {
                setError(v.error);
                return;
              }
              setSubmitOpen(true);
            }}
          >
            Ajukan untuk Review
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={submitOpen}
        title="Kirim perubahan untuk ditinjau?"
        description="Ringkasan usulan sebelum dikirim ke Administrator."
        confirmLabel="Kirim pengajuan"
        cancelLabel="Batalkan"
        busy={busy}
        onCancel={() => setSubmitOpen(false)}
        onConfirm={() => void confirmSubmit()}
      >
        {selected && validatedPreview.ok ? (
          <div className="ws-dialog-summary">
            <ValueComparison
              previousValue={previousValue}
              previousDisplay={current?.display}
              proposedValue={validatedPreview.proposedValue}
              proposedDisplay={validatedPreview.proposedDisplay}
              unit={unit}
            />
            <dl className="ws-dl">
              <div>
                <dt>Indikator</dt>
                <dd>{selected.name}</dd>
              </div>
              <div>
                <dt>Periode</dt>
                <dd>{period}</dd>
              </div>
              <div>
                <dt>Sumber Data</dt>
                <dd>{sourceNote.trim() || "—"}</dd>
              </div>
              <div>
                <dt>Catatan</dt>
                <dd>{changeNote.trim() || "—"}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </ConfirmDialog>
    </section>
  );
}
