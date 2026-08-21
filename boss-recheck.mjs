import { chromium } from "playwright";
import fs from "fs";

const OUT = "/tmp/boss-screens";
fs.mkdirSync(OUT, { recursive: true });

const [email, password, attemptId, tag] = process.argv.slice(2);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 800, height: 1000 } });
const page = await context.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.fill("#email", email);
await page.fill("#password", password);
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard", { timeout: 10000 });

await page.goto(`http://localhost:3000/results?attemptId=${attemptId}`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/results-boss-${tag}.png` });
console.log(`results-boss-${tag}: saved`);

await browser.close();
console.log("done");
