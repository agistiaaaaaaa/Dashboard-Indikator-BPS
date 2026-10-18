import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ConfirmDialog } from "../components/workspace/ConfirmDialog";

interface UnsavedChangesContextValue {
  /** Register/update whether a page section has unsaved edits. */
  setDirty: (sourceId: string, dirty: boolean) => void;
  isDirty: boolean;
  /**
   * Run `action` immediately if clean; otherwise open leave confirmation.
   * Use for sidebar links, logout, and in-page navigations.
   */
  requestLeave: (action: () => void) => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(
  null
);

/**
 * Centralized unsaved-change guard for workspace navigation.
 * Pages register dirty state; layout intercepts nav/logout.
 */
export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const isDirty = useMemo(
    () => Object.values(flags).some(Boolean),
    [flags]
  );

  const setDirty = useCallback((sourceId: string, dirty: boolean) => {
    setFlags((prev) => {
      if (!dirty) {
        if (!(sourceId in prev)) return prev;
        const next = { ...prev };
        delete next[sourceId];
        return next;
      }
      if (prev[sourceId] === true) return prev;
      return { ...prev, [sourceId]: true };
    });
  }, []);

  const requestLeave = useCallback(
    (action: () => void) => {
      if (!isDirty) {
        action();
        return;
      }
      setPendingAction(() => action);
    },
    [isDirty]
  );

  const value = useMemo(
    () => ({ setDirty, isDirty, requestLeave }),
    [setDirty, isDirty, requestLeave]
  );

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={pendingAction !== null}
        title="Perubahan belum disimpan"
        description="Apakah Anda yakin ingin meninggalkan halaman ini? Perubahan yang belum disimpan akan hilang."
        cancelLabel="Batalkan"
        confirmLabel="Tinggalkan"
        danger
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          const action = pendingAction;
          setPendingAction(null);
          // Clear dirty flags so the destination page starts clean.
          setFlags({});
          action?.();
        }}
      />
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges(): UnsavedChangesContextValue {
  const ctx = useContext(UnsavedChangesContext);
  if (!ctx) {
    throw new Error("useUnsavedChanges must be used within UnsavedChangesProvider");
  }
  return ctx;
}

/** Optional hook when provider may be absent (defensive). */
export function useUnsavedChangesOptional(): UnsavedChangesContextValue | null {
  return useContext(UnsavedChangesContext);
}
