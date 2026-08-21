import { chromium } from "playwright";
import fs from "fs";

const OUT = "/tmp/boss-screens";
fs.mkdirSync(OUT, { recursive: true });

const [email, password, tag] = process.argv.slice(2);

const browser = await chromium.launch({
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    "--use-file-for-fake-audio-capture=/tmp/test-pitch.wav",
  ],
});
const context = await browser.newContext({ viewport: { width: 800, height: 1000 } });
await context.grantPermissions(["microphone"], { origin: "http://localhost:3000" });
const page = await context.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.fill("#email", email);
await page.fill("#password", password);
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard", { timeout: 10000 });

await page.goto("http://localhost:3000/pitch", { waitUntil: "networkidle" });
await page.waitForSelector("text=Tap to start", { timeout: 10000 });
await page.click("text=Tap to start");
await page.waitForSelector("text=Stop Recording", { timeout: 5000 });
await page.waitForTimeout(9000);
await page.click("text=Stop Recording");
await page.waitForSelector('text=/score my pitch/i', { timeout: 60000 });
await page.click('text=/score my pitch/i');
await page.waitForURL("**/results**", { timeout: 60000 });
await page.waitForTimeout(2500);

const card = page.locator("div").filter({ hasText: "" }).first();
await page.screenshot({ path: `${OUT}/results-boss-${tag}.png` });
console.log(`results-boss-${tag}: saved, url:`, page.url());

await browser.close();
console.log("done");
