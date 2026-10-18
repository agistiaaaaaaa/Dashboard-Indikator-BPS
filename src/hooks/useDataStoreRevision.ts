import { useEffect, useState } from "react";
import { DATA_STORE_CHANGED_EVENT } from "../data-management/storeEvents";

/**
 * Bumps when the development data-management store changes in this tab.
 * Cross-tab sync is not available with sessionStorage (documented limitation).
 */
export function useDataStoreRevision(): number {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const bump = () => setRevision((n) => n + 1);
    window.addEventListener(DATA_STORE_CHANGED_EVENT, bump);
    return () => window.removeEventListener(DATA_STORE_CHANGED_EVENT, bump);
  }, []);

  return revision;
}
