# README — Dashboard Indikator Strategis BPS Lombok Tengah

Aplikasi full-stack untuk dashboard publik dan ruang kerja pemutakhiran indikator strategis.

## Mulai cepat (local)

```bash
npm install
npm --prefix server install
# salin .env.example → .env dan server/.env.example → server/.env
npm run db:generate && npm run db:push && npm run db:seed
npm run dev:api   # :4000
npm run dev       # :5173
```

## Dokumentasi serah-terima BPS

Mulai dari: **[docs/BPS_HANDOVER.md](./docs/BPS_HANDOVER.md)**

Checklist integrasi: [docs/BPS_INTEGRATION_CHECKLIST.md](./docs/BPS_INTEGRATION_CHECKLIST.md)

Demo: [docs/DEMO_GUIDE.md](./docs/DEMO_GUIDE.md)

## Verifikasi

```bash
npm run test:data
npm run test            # API harus running
npm run test:browser    # API + Vite + Chrome
npm run typecheck && npm run typecheck:api
npm run build && npm run build:api
```

## Status

**CORE APPLICATION COMPLETE — READY FOR BPS HANDOVER / INTEGRATION**

SSO, WebAPI produksi, dan hosting BPS **belum** termasuk (menunggu kontrak/keputusan BPS).
