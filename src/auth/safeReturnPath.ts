/**
 * Sanitize post-login return paths.
 * Only allow same-origin relative paths under /workspace.
 */
export function safeWorkspaceReturnPath(from: unknown): string {
  const fallback = "/workspace";
  if (typeof from !== "string" || !from) return fallback;

  // Block protocol-relative and absolute URLs
  if (from.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(from)) {
    return fallback;
  }
  if (!from.startsWith("/")) return fallback;

  try {
    const url = new URL(from, "https://bps.local.invalid");
    if (url.origin !== "https://bps.local.invalid") return fallback;
    if (url.pathname !== "/workspace" && !url.pathname.startsWith("/workspace/")) {
      return fallback;
    }
    // Reject path segments that escape after normalization (.. already resolved by URL)
    if (url.pathname.includes("\\")) return fallback;
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}
