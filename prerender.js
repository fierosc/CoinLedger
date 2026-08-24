// prerender.js
//
// Loads Last.html in a real (headless) browser, lets its own JS run and
// populate #content exactly as it does for a visitor, then saves the
// resulting DOM back out as plain HTML — so the wiki's actual text (item
// names, rewards, drop rates, etc.) is present in the raw file itself,
// not only after client-side JS executes.
//
// Nothing about the page's behavior changes for a visitor: the landing
// gate still shows first, "Enter the Ledger" still works, search/filters/
// modal still work — because the original <script> tags are carried over
// untouched and simply re-run render() on top of what's already there.
//
// Usage:
//   npm install playwright
//   npx playwright install chromium
//   node prerender.js Last.html Last.static.html

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

async function main() {
  const inputPath = path.resolve(process.argv[2] || "Last.html");
  const outputPath = path.resolve(process.argv[3] || "Last.static.html");

  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") console.error("[page error]", msg.text());
  });

  await page.goto("file://" + inputPath);

  // The site sets window.__ledgerInitialized = true once render(),
  // renderReferences(), renderRates(), etc. have all run successfully.
  // Waiting on that (rather than a fixed timeout) means this script
  // fails loudly if a future edit breaks init, instead of silently
  // saving a half-rendered page.
  await page.waitForFunction("window.__ledgerInitialized === true", {
    timeout: 10000,
  });

  const html = await page.evaluate(() => "<!DOCTYPE html>\n" + document.documentElement.outerHTML);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html, "utf8");

  await browser.close();

  const before = fs.statSync(inputPath).size;
  const after = fs.statSync(outputPath).size;
  console.log(`Wrote ${outputPath}`);
  console.log(`${inputPath}: ${before} bytes -> ${outputPath}: ${after} bytes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
