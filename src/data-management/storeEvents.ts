/** Same-tab notification after development data-management store writes. */
export const DATA_STORE_CHANGED_EVENT = "bps-loteng:data-mgmt-changed";

export function notifyDataStoreChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DATA_STORE_CHANGED_EVENT));
}
