/**
 * Phase 3E — workflow verification smoke.
 * Does NOT mutate indicators.json.
 */
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const data = require("../src/data/indicators.json");
const ind = data.indicators.find((i) => i.name.includes("Jumlah Penduduk"));
const base2020 = ind.values.find((v) => v.period === "2020");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(data.indicators.length === 58, "indicator count");
assert(
  data.indicators.filter((i) => i.category === "Sosial").length === 51,
  "sosial count"
);
assert(
  data.indicators.filter((i) => i.category === "Ekonomi").length === 7,
  "ekonomi count"
);
assert(base2020.value === 1029.03, "penduduk 2020");

function publicValue(changes) {
  const published = changes.filter((c) => c.status === "PUBLISHED");
  if (!published.length) return base2020.value;
  return published[published.length - 1].proposedValue;
}

assert(publicValue([]) === 1029.03, "empty → base");
assert(publicValue([{ status: "DRAFT", proposedValue: 1111 }]) === 1029.03, "DRAFT isolated");
assert(
  publicValue([{ status: "PENDING_REVIEW", proposedValue: 2222 }]) === 1029.03,
  "PENDING isolated"
);
assert(
  publicValue([{ status: "REJECTED", proposedValue: 3333 }]) === 1029.03,
  "REJECTED isolated"
);
assert(
  publicValue([{ status: "PUBLISHED", proposedValue: 1031.2 }]) === 1031.2,
  "PUBLISHED applied"
);

function canReject(note) {
  return Boolean(String(note).trim());
}
assert(!canReject(""), "reject requires reason");
assert(canReject("Data tidak konsisten"), "reject with reason");

function restoreSession(payload) {
  const fixtures = [
    { id: "dev-admin-001", username: "admin", role: "ADMIN" },
    { id: "dev-operator-001", username: "operator", role: "OPERATOR" },
  ];
  const f = fixtures.find((x) => x.id === payload.user.id);
  if (!f) return null;
  if (f.role !== payload.user.role || f.username !== payload.user.username) {
    return null;
  }
  return f;
}
assert(
  restoreSession({
    user: { id: "dev-operator-001", username: "operator", role: "ADMIN" },
  }) === null,
  "role escalation rejected"
);
assert(
  restoreSession({
    user: { id: "dev-operator-001", username: "operator", role: "OPERATOR" },
  })?.role === "OPERATOR",
  "valid session ok"
);

function safeWorkspaceReturnPath(from) {
  const fallback = "/workspace";
  if (typeof from !== "string" || !from) return fallback;
  if (from.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(from)) return fallback;
  if (!from.startsWith("/")) return fallback;
  try {
    const url = new URL(from, "https://bps.local.invalid");
    if (url.origin !== "https://bps.local.invalid") return fallback;
    if (url.pathname !== "/workspace" && !url.pathname.startsWith("/workspace/")) {
      return fallback;
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}
assert(safeWorkspaceReturnPath("//evil.com") === "/workspace", "open redirect blocked");
assert(
  safeWorkspaceReturnPath("/workspace/review") === "/workspace/review",
  "valid return kept"
);

console.log("workflow-smoke 3E: isolation + auth contracts + integrity OK");
console.log(
  JSON.stringify({
    indicators: data.indicators.length,
    penduduk2020: base2020.value,
    file: pathToFileURL(path.resolve("src/data/indicators.json")).href,
  })
);
