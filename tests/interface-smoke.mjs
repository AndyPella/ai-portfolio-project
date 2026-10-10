import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const port = 3011,
  base = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  { stdio: "pipe", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } },
);
let output = "",
  browser;
server.stdout.on("data", (d) => (output += d));
server.stderr.on("data", (d) => (output += d));
try {
  for (let i = 0; i < 100; i++) {
    try {
      await fetch(base);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  const executablePath = process.env.BROWSER_EXECUTABLE;
  const args = process.env.BROWSER_ARGS
    ? JSON.parse(process.env.BROWSER_ARGS)
    : [];
  browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args,
  });
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1050 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base, { waitUntil: "networkidle" });
  const main = page.locator("#customer-service"),
    panel = main.locator(".decision-panel");
  await page
    .getByLabel("Decision reason", { exact: true })
    .fill("Customer details and equipment confirmed");
  await page
    .getByLabel("Evidence reference", { exact: true })
    .fill("UI-SMOKE-EVIDENCE");
  await page
    .getByRole("button", { name: "Protect for four hours", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Approve proposal", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Record customer acceptance", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Accept recorded" })
    .waitFor();
  assert.match(await panel.innerText(), /Confirmed/);
  await page
    .getByRole("button", { name: "Advance four hours", exact: true })
    .click();
  assert.match(await panel.innerText(), /EQ-1001 · Confirmed/);
  console.log(
    "PASS existing-customer approval, acceptance and confirmed timer retention",
  );
  await page
    .getByRole("combobox", { name: /Demo request/ })
    .selectOption("REQ-SCN-004");
  assert.match(await panel.innerText(), /Rental Ready with Conditions/);
  await page
    .getByRole("button", { name: "Protect for four hours", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Record customer decline", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Decline conditions recorded" })
    .waitFor();
  assert.match(await panel.innerText(), /Not Available/);
  console.log("PASS service disclosure and recorded customer decline");
  await page
    .getByRole("combobox", { name: /Demo request/ })
    .selectOption("REQ-SCN-002");
  assert.match(await panel.innerText(), /Remediation Required/);
  await page
    .getByRole("combobox", { name: /Acting staff/ })
    .selectOption("DEMO-MECH");
  await page
    .getByRole("button", {
      name: "Record passed demo safety checks",
      exact: true,
    })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Pass inspection recorded" })
    .waitFor();
  await page
    .getByRole("button", { name: "Release selected hold", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Release hold recorded" })
    .waitFor();
  assert.match(await panel.innerText(), /Rental Ready/);
  await page
    .getByRole("combobox", { name: /Acting staff/ })
    .selectOption("DEMO-CS");
  await page
    .getByRole("button", { name: "Protect for four hours", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Advance four hours", exact: true })
    .click();
  await main
    .locator("details")
    .filter({
      has: page.getByText("All matching equipment and allocation history", {
        exact: true,
      }),
    })
    .locator("summary")
    .click();
  assert.match(await main.innerText(), /Expired/);
  assert.equal(
    await page
      .getByRole("button", { name: "Record customer acceptance", exact: true })
      .isDisabled(),
    true,
  );
  console.log(
    "PASS qualified inspection, routine release and exact four-hour expiry",
  );
  await page
    .getByRole("combobox", { name: /Demo request/ })
    .selectOption("REQ-SCN-007");
  assert.match(await panel.innerText(), /Required site documentation: Pending/);
  assert.equal(
    await page
      .getByRole("button", { name: "Record customer acceptance", exact: true })
      .isDisabled(),
    true,
  );
  console.log(
    "PASS customer documentation gate remains separate from equipment readiness",
  );
  await page.evaluate(() =>
    window.scrollTo(0, document.querySelector("#customer-service").offsetTop),
  );
  if (process.env.UI_SCREENSHOT_DIR)
    await page.screenshot({
      path: process.env.UI_SCREENSHOT_DIR + "/desktop.png",
    });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
    false,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() =>
    window.scrollTo(0, document.querySelector("#customer-service").offsetTop),
  );
  if (process.env.UI_SCREENSHOT_DIR)
    await page.screenshot({
      path: process.env.UI_SCREENSHOT_DIR + "/mobile.png",
    });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
    false,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS desktop/mobile layout, no horizontal overflow, no browser page errors",
  );
} catch (error) {
  console.error(output);
  throw error;
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
