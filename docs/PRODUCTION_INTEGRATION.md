# Production Integration Discovery (Phase 4A)

**Status:** Discovery / contract audit only.  
**Date basis:** repository state after Phase 3E.

**Production authentication is NOT implemented** because the official BPS
authentication/backend contract has not yet been provided.

**Production data-management backend is NOT implemented** for the same reason.

This document does **not** invent endpoints, tokens, or database schemas.
Classifications:

| Label | Meaning |
|-------|---------|
| **CONFIRMED** | Evidenced in this repository |
| **PARTIALLY CONFIRMED** | Seam/placeholder exists; contract incomplete |
| **NOT PROVIDED** | No production contract in repo |
| **UNKNOWN** | Cannot be determined from current evidence |

---

## 1. Current Architecture

```
PUBLIC UI
  → indicatorService
  → IndicatorProvider (mock JSON today | bps placeholder)
  → indicators.json  (+ runtime PUBLISHED overlay from session store)

LOGIN UI
  → AuthProvider (React)
  → authService
  → AuthProvider adapter (development-mock only)

WORKSPACE UI
  → RequireAuth / RequirePermission
  → data-management service
  → DataManagementProvider (development-store / sessionStorage)
```

### Confirmed modules (CONFIRMED)

| Area | Location |
|------|----------|
| Auth types / roles | `src/auth/types.ts`, `src/auth/roles.ts` |
| Permissions / nav | `src/auth/permissions.ts` |
| Auth service | `src/auth/authService.ts` |
| Mock auth | `src/auth/providers/devMockAuthProvider.ts` |
| Auth provider switch | `src/auth/providers/index.ts` |
| Data-management types | `src/data-management/types.ts` |
| Development store | `src/data-management/providers/developmentStoreProvider.ts` |
| Published overlay | `src/data-management/publishedOverlay.ts` |
| Indicator service | `src/services/indicatorService.ts` |
| Indicator providers | `src/data/providers/*` |
| Env seam | `src/config/env.ts`, `.env.example` |
| Workflow docs | `docs/AUTH.md`, `docs/DATA_MANAGEMENT.md`, `docs/WORKFLOW.md` |

### Explicitly absent (CONFIRMED absent)

- No `fetch` / HTTP client usage under `src/`
- No JWT / OAuth / SSO / cookie auth implementation
- No production auth endpoints
- No production CRUD / review / publish API
- No deployment manifests for a BPS backend in this repo

---

## 2. Development vs Production

| Concern | Development (current) | Production (required) |
|---------|----------------------|------------------------|
| Auth | Mock fixtures + sessionStorage | Official BPS auth — **NOT PROVIDED** |
| Indicator reads | `indicators.json` + optional overlay | Official published data API — **NOT PROVIDED** |
| Draft/review/publish | sessionStorage store (per tab) | Shared multi-user backend — **NOT PROVIDED** |
| Authorization | Frontend guards only | Server-side enforcement — **NOT PROVIDED** |
| Audit | Append-only in session | Durable audit store — **NOT PROVIDED** |

Frontend guards are **not** a production security boundary.

---

## 3. Authentication Contract

### PRODUCTION AUTH CONTRACT: **NOT PROVIDED**

Evidence found:

- Development mock only (`development-mock` mode)
- Placeholder comment that a future `BpsAuthProvider` would switch in `src/auth/providers/index.ts`
- Docs list required auth items but no official BPS protocol

No production login URL, token format, cookie policy, or role-claim mapping exists in the repo.

### Information required from BPS

1. Login endpoint / protocol (OIDC, SAML, form, other)
2. Logout mechanism (local clear vs server revoke)
3. Session or token mechanism
4. Token / session expiration rules
5. Refresh mechanism (if any)
6. How roles map to `ADMIN` / `OPERATOR` (or equivalents)
7. User identity fields (id, name, username/email)
8. Authorization model (claims, groups, scopes)
9. Cookie / CORS requirements for the BPS domain
10. CSRF requirements (if cookie-based)
11. Password policy (if password login)
12. SSO requirements (if applicable)

### Frontend `AuthProvider` interface (CONFIRMED sufficient as seam)

```
login(credentials) → AuthResult
logout() → void
getSession() → AuthSessionState
mode: "development-mock" | "bps"
```

Maps cleanly to a future `BpsAuthProvider` **once** BPS provides the contract.
No fake network calls should be added until then.

---

## 4. Data Management Contract

### Production internal data-management API: **NOT PROVIDED**

| Operation | Classification |
|-----------|----------------|
| GET PUBLISHED DATA (dashboard) | **PARTIALLY CONFIRMED** — mock JSON + overlay; `bpsIndicatorProvider` throws until configured |
| GET INDICATOR | **PARTIALLY CONFIRMED** — same as above |
| CREATE DRAFT | **NOT PROVIDED** (dev store only) |
| UPDATE DRAFT | **NOT PROVIDED** (dev store only) |
| DELETE DRAFT | **NOT PROVIDED** (dev store only) |
| SUBMIT FOR REVIEW | **NOT PROVIDED** (dev store only) |
| GET PENDING REVIEW | **NOT PROVIDED** (dev store only) |
| REJECT | **NOT PROVIDED** (dev store only) |
| APPROVE / PUBLISH | **NOT PROVIDED** (dev store only) |
| GET SUBMISSIONS (own) | **NOT PROVIDED** (dev store only) |
| GET AUDIT HISTORY | **NOT PROVIDED** (dev store only) |

### Frontend `DataManagementProvider` interface (CONFIRMED sufficient as seam)

Operations already modeled:

- `listChanges`, `getChange`
- `saveDraft`, `submitForReview`
- `reviewChange`, `publishChange`, `deleteDraft`
- `listAudit`

A future `BpsDataManagementProvider` can implement the same interface without rewriting workspace UI, **after** BPS supplies real endpoints.

---

## 5. BPS WebAPI Analysis

### Evidence (PARTIALLY CONFIRMED as a *public statistics* reference only)

- Docs mention [BPS WebAPI developer login](https://webapi.bps.go.id/developer/login)
- Env placeholder: `VITE_BPS_API_BASE_URL`
- `bpsIndicatorProvider` is a **throwing placeholder** — no endpoints implemented

### Separation (must not be conflated)

| API class | What it typically is | Supports auth / draft / approve / audit? |
|-----------|----------------------|------------------------------------------|
| **Public statistics WebAPI** | Read published national/regional stats | **NOT CONFIRMED** for internal workflow |
| **Internal data-management API** | Staff CRUD + review + publish | **NOT PROVIDED** in this repo |

**Do not assume** that public BPS WebAPI equals internal ADMIN/OPERATOR workflow API.

Until BPS confirms otherwise:

- Public WebAPI → candidate for **published indicator reads only** (UNKNOWN fit for Kab. Lombok Tengah inventory)
- Internal workflow API → **NOT PROVIDED**

---

## 6. Publishing Model

### Development model (CONFIRMED)

```
BASE (indicators.json)
  + PUBLISHED overlay (session)
  = public read model
```

Only `PUBLISHED` changes affect public reads. DRAFT / PENDING_REVIEW / REJECTED never leak.

### Production candidate models (no selection yet)

| Model | Idea | Needs from BPS |
|-------|------|----------------|
| **A** | Observation row status = PUBLISHED | Status field rules, uniqueness |
| **B** | Versioned dataset / snapshot | Versioning API, rollback |
| **C** | Separate published table/view | Read path for public API |
| **D** | API-composed published read model | Query contract, caching |

**Selection blocked** until BPS states how published values are stored and served to the public site.

---

## 7. Authorization

Frontend permission matrix (CONFIRMED in `src/auth/permissions.ts`) is UX / defense-in-depth only.

### Production backend **must** enforce independently

**Public**

- VIEW_PUBLIC_DATA
- SEARCH_PUBLIC_DATA
- EXPORT_PUBLIC_DATA

**Operator**

- VIEW_INTERNAL_DATA
- CREATE_DATA_DRAFT
- UPDATE_DATA_DRAFT
- SUBMIT_DATA_CHANGE

**Admin**

- all Operator capabilities plus
- REVIEW_DATA_CHANGE
- APPROVE_DATA_CHANGE
- PUBLISH_DATA
- VIEW_CHANGE_HISTORY
- MANAGE_USERS
- MANAGE_SETTINGS

*(Frontend uses slightly different string keys such as `create_draft`, `review_submissions`; mapping to BPS claims is **NOT PROVIDED**.)*

---

## 8. Audit Requirements

### Development actions (CONFIRMED)

`CREATE_DRAFT`, `UPDATE_DRAFT`, `DELETE_DRAFT`, `SUBMIT_FOR_REVIEW`, `APPROVE`, `REJECT`, `PUBLISH`

### Minimum production audit fields (contract discovery)

- event ID
- timestamp
- actor (+ role)
- action
- indicator ID
- period (preserve special labels)
- previous value / new value (nullable)
- previous status / new status
- note / reason
- change / request ID

Persistence technology and retention policy: **NOT PROVIDED**.

---

## 9. Multi-user Requirements

### Why sessionStorage is insufficient (CONFIRMED limitation)

- Per browser tab only
- Not shared across Operators/Admins
- Lost on tab close
- No concurrent conflict control
- Not an authoritative audit store

### Production must support

- Multiple Operators and Admins
- Shared review queue and published state
- Shared durable audit history
- Concurrent updates and conflict handling

### Open concurrency questions for BPS

1. Two Operators edit the same indicator/period — last-write, lock, or reject?
2. Admin reviews a submission after base data changed — revalidate?
3. Is optimistic locking / version token required?
4. Can multiple PENDING_REVIEW exist for the same indicator/period?
5. Who may edit REJECTED submissions (owner only vs any Operator)?

Answers: **NOT PROVIDED**.

---

## 10. Conceptual API Operation Contract

Paths: **NOT PROVIDED** until BPS supplies them.

| Operation | Purpose | Caller | Request (conceptual) | Response (conceptual) | Authz |
|-----------|---------|--------|----------------------|------------------------|-------|
| AUTH_LOGIN | Authenticate staff | Public login UI | username/password or SSO | user + session | — |
| AUTH_LOGOUT | End session | Authenticated | session | ok | authenticated |
| AUTH_GET_SESSION | Restore session | App boot | session/cookie | user or anonymous | — |
| GET_PUBLISHED_INDICATORS | Public inventory | Public | filters optional | indicators + periods | public read |
| GET_INDICATOR | One indicator | Public / staff | id | indicator | public or staff |
| CREATE_DRAFT | New observation change | Operator/Admin | indicator, period, value, source, note | change | CREATE_DRAFT |
| UPDATE_DRAFT | Edit draft/rejected | Owner (+ rules) | changeId, fields | change | UPDATE_DRAFT |
| DELETE_DRAFT | Remove unsaved draft | Owner | changeId | ok | UPDATE_DRAFT |
| SUBMIT_CHANGE | Draft → PENDING_REVIEW | Owner | changeId | change | SUBMIT |
| GET_REVIEW_QUEUE | Pending list | Admin | filters | changes[] | REVIEW |
| REJECT_CHANGE | Pending → REJECTED | Admin | changeId, reason | change | REJECT |
| APPROVE_CHANGE | Pending → PUBLISHED | Admin | changeId, note? | change | APPROVE/PUBLISH |
| GET_SUBMISSIONS | Own / filtered list | Operator/Admin | filters | changes[] | VIEW |
| GET_AUDIT_HISTORY | Audit trail | Admin | filters | events[] | VIEW_HISTORY |

Error cases (expected contract topics, not implemented): 401, 403, 404, 409 conflict, 422 validation, 500.

---

## 11. Environment Configuration

### Present (CONFIRMED)

```
VITE_DATA_PROVIDER=mock|bps   # public indicator provider switch
VITE_BPS_API_BASE_URL=…       # placeholder comment only
```

### Distinction

| Type | Examples | Rule |
|------|----------|------|
| **Public frontend config** | API base URL for public reads (if CORS-safe) | May be `VITE_*` |
| **Server-only secrets** | client secrets, API keys, admin tokens | **Never** in frontend env/bundle |

Suggested future public vars (do **not** add until BPS confirms):

- public published-data base URL
- auth redirect / public client id (OIDC public clients only)

Auth and data-management secrets belong on a backend BFF or BPS gateway — **NOT PROVIDED**.

---

## 12. Security Requirements (checklist — not implemented)

- [ ] Server-side authorization on every mutating operation
- [ ] Official authentication + session revocation
- [ ] HTTPS everywhere
- [ ] Secure cookie / token storage policy
- [ ] CSRF if cookie sessions
- [ ] CORS allowlist for BPS domains
- [ ] XSS controls (existing React escaping helps UI; not full assurance)
- [ ] Rate limiting on login and write APIs
- [ ] Server-side input validation (null, period labels, numeric)
- [ ] Durable audit integrity
- [ ] Secret management outside frontend
- [ ] Logging / monitoring
- [ ] Session expiration and concurrent session policy
- [ ] Logout / token revocation

Item status: **NOT PROVIDED** / not verified as production-ready.

---

## 13. Data Migration

### Baseline dataset (CONFIRMED — do not mutate)

File: `src/data/indicators.json`

| Fact | Value |
|------|-------|
| Indicators | 58 |
| Sosial | 51 |
| Ekonomi | 7 |
| Periods | 2014–2025 annual + special labels |
| Null cells | preserved (must remain null) |
| Penduduk 2020 | 1029.03 |

### Migration payload concepts (not table names)

**Indicator metadata:** id, name, category, canonical unit, source, description  

**Observations:** indicator id, **period label as string** (not year-only integer), value nullable, display, status  

**Special periods must survive:** e.g. `Maret 2025`, `Agustus 2025` — do not normalize to `2025` alone.

**Workflow data (separate from base):** change requests, statuses, reviewers, notes, audit events.

Migration tooling / target DB: **NOT PROVIDED**.

---

## 14. Source of Truth (intended layers — selection TBD)

| Layer | Candidate ownership |
|-------|---------------------|
| Source / official BPS systems | Authoritative collection |
| Operational database | Metadata, observations, workflow, audit |
| Published dataset / view / API | Public-facing values only |
| Public dashboard | Read-only consumer |

Ownership split for metadata vs workflow vs audit: **UNKNOWN** until BPS architecture is provided.

---

## 15. BPS Information Request

Practical questionnaire for BPS stakeholders (Indonesian, send-ready):

→ **`docs/BPS_TECHNICAL_RFI.md`** (Phase 4B)

Summary groups below remain for quick reference.

### A. Authentication
- Protocol and endpoints for staff login/logout
- Session/token format, expiry, refresh, revocation
- Role claim mapping to ADMIN / OPERATOR
- Cookie / CORS / CSRF rules

### B. Backend / API
- Is there an **internal** data-management API separate from public WebAPI?
- OpenAPI / sample responses for draft → review → publish
- Error codes and validation rules

### C. Database
- Where will Kabupaten Lombok Tengah indicator inventory live?
- Who owns schema and migrations?

### D. Roles
- Exact role names and permission mapping
- Can one person hold both roles?

### E. Workflow
- Allowed status transitions
- Who may delete drafts / edit rejected items
- Concurrent edit policy

### F. Publishing
- Which publishing model (A–D) is official?
- How does the public site obtain published values?

### G. Audit
- Required fields, retention, immutability, export

### H. Deployment
- Hosting (BPS infra vs other), staging URL, CI/CD, domain

### I. Security
- Threat model, WAF, rate limits, secret management, pen-test requirements

### J. Existing BPS WebAPI
- Can public WebAPI serve **this** Kab. Lombok Tengah inventory?
- Domain/variable codes if any
- Confirmed: does it support **write / approve / audit**? (expected: no — please confirm)

---

## 16. Production Blockers

1. Official authentication contract — **NOT PROVIDED**
2. Official internal data-management API — **NOT PROVIDED**
3. Role/permission claim mapping — **NOT PROVIDED**
4. Published-data architecture choice — **NOT PROVIDED**
5. Server-side authorization — **NOT PROVIDED**
6. Durable multi-user persistence + audit — **NOT PROVIDED**
7. Staging environment for integration tests — **NOT PROVIDED**
8. Confirmation whether public WebAPI is relevant to this inventory — **UNKNOWN**

---

## 17. Integration Sequence (recommended)

1. Obtain official BPS **auth** contract  
2. Obtain official **data-management** API contract  
3. Confirm role/permission mapping  
4. Confirm published-data architecture  
5. Confirm audit requirements  
6. Implement `BpsAuthProvider` (no UI rewrite)  
7. Implement `BpsDataManagementProvider` (+ published indicator provider if needed)  
8. Integration testing against **staging**  
9. Security testing  
10. Production deployment  

Do not skip staging. Do not replace mock providers until contracts are confirmed.

---

## 18. Frontend provider readiness

| Provider | Status |
|----------|--------|
| `AuthProvider` interface | **CONFIRMED** ready as seam |
| `developmentMockAuthProvider` | Development only |
| `DataManagementProvider` interface | **CONFIRMED** ready as seam |
| `developmentStoreDataManagementProvider` | Development only |
| `IndicatorProvider` + `bpsIndicatorProvider` | **PARTIALLY CONFIRMED** — placeholder throws |
| HTTP client layer | **NOT PROVIDED** (none under `src/`) |

**No code changes required in Phase 4A** beyond this discovery document.
