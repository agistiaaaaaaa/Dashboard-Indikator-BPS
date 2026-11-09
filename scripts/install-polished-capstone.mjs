/**
 * Promote *.polished.pptx to the canonical presentation filename.
 * Laporan (.docx) dibangkitkan oleh scripts/generate-capstone-docs.mjs.
 * Close Word/PowerPoint first if files are locked.
 *
 * Usage: npm run capstone:install-polished
 */
import { copyFileSync, existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const pairs = [
  [
    "docs/CAPSTONE_PRESENTATION_BPS_LOMBOK_TENGAH.polished.pptx",
    "docs/CAPSTONE_PRESENTATION_BPS_LOMBOK_TENGAH.pptx",
  ],
];

let failed = false;
for (const [src, dest] of pairs) {
  const from = resolve(src);
  const to = resolve(dest);
  if (!existsSync(from)) {
    console.error("Missing polished file:", from);
    failed = true;
    continue;
  }
  try {
    copyFileSync(from, to);
    unlinkSync(from);
    console.log("Installed", to);
  } catch (err) {
    failed = true;
    console.error("Could not install", to);
    console.error("  Close Word/PowerPoint, then re-run: npm run capstone:install-polished");
    console.error(" ", err.message);
  }
}

process.exit(failed ? 1 : 0);
