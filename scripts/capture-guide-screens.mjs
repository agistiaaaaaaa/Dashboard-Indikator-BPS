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
  // logout if redirected
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

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  await page.goto(`${WEB}/`, { waitUntil: "networkidle" });
  await shot(page, "01-beranda");

  await page.goto(`${WEB}/dashboard-indikator`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot(page, "02-dashboard");

  const detail = page.getByRole("button", { name: /^Detail$/i }).first();
  if (await detail.count()) {
    await detail.click();
    await page.waitForTimeout(500);
    await shot(page, "03-detail-drawer");
    await page.keyboard.press("Escape");
  }

  await page.goto(`${WEB}/login`, { waitUntil: "networkidle" });
  await shot(page, "04-login");

  await login(page, "operator", "dev-operator-only");
  await shot(page, "05-workspace-operator");

  await page.goto(`${WEB}/workspace/pemutakhiran`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot(page, "06-pemutakhiran");

  await page.goto(`${WEB}/workspace/pengajuan`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot(page, "07-pengajuan");

  // switch to admin
  await page.goto(`${WEB}/workspace`);
  const keluar = page.getByRole("button", { name: "Keluar" });
  if (await keluar.count()) {
    await keluar.click();
    await page.waitForTimeout(400);
    const tinggalkan = page.getByRole("button", { name: "Tinggalkan" });
    if (await tinggalkan.count()) await tinggalkan.click();
  }
  await login(page, "admin", "dev-admin-only");
  await shot(page, "08-workspace-admin");

  await page.goto(`${WEB}/workspace/review`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot(page, "09-review");

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
