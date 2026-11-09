/**
 * Capture UI screenshots for the user guide (Playwright + system Chrome).
 * Requires Vite + API running.
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const WEB = (process.env.WEB_BASE_URL || "http://localhost:5173").replace(/\/$/, "");
const CHROME =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = resolve("docs/guide-assets");

mkdirSync(OUT, { recursive: true });

async function login(page, user, pass) {
  await page.goto(`${WEB}/login`, { waitUntil: "networkidle" });
  if (!page.url().includes("/login")) {
    const keluar = page.getByRole("button", { name: "Keluar" });
    if (await keluar.count()) {
      await keluar.click();
      await page.waitForTimeout(400);
      const tinggalkan = page.getByRole("button", { name: "Tinggalkan" });
      if (await tinggalkan.count()) await tinggalkan.click();
      await page.goto(`${WEB}/login`, { waitUntil: "networkidle" });
    }
  }
  await page.fill('input[name="username"]', user);
  await page.fill('input[name="password"]', pass);
  await page.click("button.login-submit");
  await page.waitForURL(/\/workspace/, { timeout: 15000 });
}

async function shot(page, name, fullPage = false) {
  const path = resolve(OUT, `${name}.png`);
  await page.screenshot({ path, fullPage, type: "png" });
  console.log("saved", path);
}

async function logout(page) {
  await page.goto(`${WEB}/workspace`);
  const keluar = page.getByRole("button", { name: "Keluar" });
  if (await keluar.count()) {
    await keluar.click();
    await page.waitForTimeout(400);
    const tinggalkan = page.getByRole("button", { name: "Tinggalkan" });
    if (await tinggalkan.count()) await tinggalkan.click();
  }
}

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  // 01 Homepage
  await page.goto(`${WEB}/`, { waitUntil: "networkidle" });
  await shot(page, "01-beranda");

  // 02 Dashboard
  await page.goto(`${WEB}/dashboard-indikator`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await shot(page, "02-dashboard");

  // 02b Filter / search focus
  const search = page.locator('input[placeholder*="Cari"], input[type="search"]').first();
  if (await search.count()) {
    await search.fill("Penduduk");
    await page.waitForTimeout(600);
  }
  const kategori = page.locator("select, [role='combobox']").first();
  if (await kategori.count()) {
    try {
      await kategori.selectOption({ label: /Sosial/i });
    } catch {
      /* ignore if not native select */
    }
  }
  await shot(page, "02b-filter-search");

  // 02c Chart area
  await search.fill("").catch(() => {});
  const chart = page.locator(".trend-panel").first();
  await chart.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await chart.screenshot({ path: resolve(OUT, "02c-chart.png") });
  console.log("saved", resolve(OUT, "02c-chart.png"));

  // 02d Table
  const table = page.locator("table").first();
  if (await table.count()) {
    await table.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
  }
  await shot(page, "02d-table");

  // 03 Detail
  await page.goto(`${WEB}/dashboard-indikator?detail=sosial__persentase-penduduk-miskin-p0`, {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(800);
  await shot(page, "03-detail-drawer");
  await page.keyboard.press("Escape");

  // 04 Login (empty — no credentials visible)
  await page.goto(`${WEB}/login`, { waitUntil: "networkidle" });
  await shot(page, "04-login");

  // Operator flow
  await login(page, "operator", "dev-operator-only");
  await shot(page, "05-workspace-operator");

  await page.goto(`${WEB}/workspace/pemutakhiran`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await shot(page, "06-pemutakhiran");

  // Try open first indicator for form/draft view
  const pick = page.locator("button, a, tr").filter({ hasText: /Penduduk|Indikator/i }).first();
  if (await pick.count()) {
    try {
      await pick.click({ timeout: 3000 });
      await page.waitForTimeout(700);
      await shot(page, "06b-form-draft");
    } catch {
      /* optional */
    }
  }

  await page.goto(`${WEB}/workspace/pengajuan`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot(page, "07-pengajuan");

  await logout(page);

  // Admin flow
  await login(page, "admin", "dev-admin-only");
  await shot(page, "08-workspace-admin");

  await page.goto(`${WEB}/workspace/review`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await shot(page, "09-review");

  // Select first submission if any for detail / dialogs
  const row = page.locator("[data-testid='review-item'], .review-item, li, tr").first();
  if (await row.count()) {
    try {
      await row.click({ timeout: 2000 });
      await page.waitForTimeout(500);
      await shot(page, "09b-review-detail");
    } catch {
      /* optional */
    }
  }

  const tolak = page.getByRole("button", { name: /Tolak/i }).first();
  if (await tolak.count()) {
    try {
      await tolak.click({ timeout: 2000 });
      await page.waitForTimeout(400);
      await shot(page, "09c-reject-dialog");
      await page.keyboard.press("Escape");
      const batal = page.getByRole("button", { name: /Batal|Tutup/i }).first();
      if (await batal.count()) await batal.click().catch(() => {});
    } catch {
      /* optional */
    }
  }

  const setujui = page.getByRole("button", { name: /Setujui|Publish/i }).first();
  if (await setujui.count()) {
    try {
      await setujui.click({ timeout: 2000 });
      await page.waitForTimeout(400);
      await shot(page, "09d-approve-dialog");
      await page.keyboard.press("Escape");
      const batal2 = page.getByRole("button", { name: /Batal|Tutup/i }).first();
      if (await batal2.count()) await batal2.click().catch(() => {});
    } catch {
      /* optional */
    }
  }

  await page.goto(`${WEB}/workspace/riwayat`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot(page, "10-riwayat");

  await browser.close();
  console.log("Screenshots ready in", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
