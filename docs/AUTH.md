# Authentication Architecture

## Status

Autentikasi **local/staging** sudah diimplementasikan (`localApiAuthProvider` → Express API).

**BPS SSO belum diintegrasikan** — kontrak/spesifikasi belum tersedia.

Guard rute frontend **bukan** batas keamanan produksi. Backend menegakkan 401/403.

Dokumen serah-terima: [BPS_HANDOVER.md](./BPS_HANDOVER.md)

## Alur

```
Public site
  → Akses Ruang Kerja / /login
  → POST /api/auth/login (bcrypt verify)
  → Cookie HttpOnly bps_loteng_session (JWT, 8 jam)
  → /workspace (RequireAuth)
      → RequirePermission per modul
```

Authenticated user yang membuka `/login` diarahkan ke `/workspace` (atau `from` yang aman).

## Seam

```
UI → AuthProvider → authService → AuthProvider adapter
     (local-api default | mock offline | BPS nanti)
```

| File | Peran |
|------|-------|
| `src/auth/types.ts` | Tipe |
| `src/auth/roles.ts` | ADMIN, OPERATOR |
| `src/auth/permissions.ts` | Matriks izin + nav |
| `src/auth/providers/localApiAuthProvider.ts` | Login/logout/me API |
| `src/auth/providers/devMockAuthProvider.ts` | Offline (`VITE_AUTH_PROVIDER=mock`) |
| `server/src/routes/auth.ts` | Endpoint auth |
| `server/src/lib/session.ts` | JWT + cookie |

## Matriks izin (workspace)

| Permission | OPERATOR | ADMIN |
|------------|:--------:|:-----:|
| VIEW_WORKSPACE / READ / UPDATE drafts / SUBMIT | ✓ | ✓ |
| VIEW_OWN_SUBMISSIONS | ✓ | ✓ |
| REVIEW / APPROVE / REJECT / PUBLISH / AUDIT | | ✓ |
| MANAGE_USERS / MANAGE_SETTINGS | | ✓ (UI placeholder) |

Publik: baca published saja; tidak ada permission workspace.

## Akun seed (DEVELOPMENT ONLY)

| Username | Password | Role |
|----------|----------|------|
| admin | `dev-admin-only` | ADMIN |
| operator | `dev-operator-only` | OPERATOR |

Password di-hash bcrypt di database; tidak dikembalikan API.

## Connecting BPS auth

Setelah kontrak tersedia: implementasi `BpsAuthProvider`, mapping role, logout/SSO, CORS domain BPS. Lihat [BPS_TECHNICAL_RFI.md](./BPS_TECHNICAL_RFI.md).
