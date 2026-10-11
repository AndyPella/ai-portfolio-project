import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const port = Number(process.env.UI_TEST_PORT ?? 3011),
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
  const lookup = main.locator("details").filter({ has: page.getByText("Find equipment by need, Equipment ID or serial number", { exact: true }) });
  await lookup.locator("summary").click();
  const units = [
    ["EQ-1001", "NSR-KX040-001"], ["EQ-1002", "NSR-S66-014"],
    ["EQ-1003", "NSR-450AJ-008"], ["EQ-1004", "NSR-G70-021"],
    ["EQ-1005", "NSR-GTH-019"], ["EQ-1006", "NSR-DPU-044"],
    ["EQ-1007", "NSR-GS2646-032"],
  ];
  await page.getByLabel("Equipment list", { exact: true }).waitFor();
  assert.equal(await page.getByLabel("Equipment list", { exact: true }).locator("option").count(), 8);
  await page.getByLabel("Decision reason", { exact: true }).fill("Verify equipment selection");
  await page.getByLabel("Evidence reference", { exact: true }).fill("UI-EQUIPMENT-LIST");
  for (const [index, [id, serial]] of units.entries()) {
    await page.getByRole("combobox", { name: /Demo request/ }).selectOption(`REQ-SCN-00${index + 1}`);
    await page.getByLabel("Equipment list", { exact: true }).selectOption(id);
    await page.getByRole("button", { name: "Confirm selected equipment", exact: true }).click();
    const dropdownResult = await panel.innerText();
    for (const query of [id.toLowerCase().replace("-", " "), serial]) {
      await page.getByLabel("Equipment lookup", { exact: true }).fill(query);
      await lookup.getByRole("button", { name: new RegExp(`^${id} ·`) }).click();
      assert.equal(await panel.innerText(), dropdownResult);
    }
  }
  await page.getByLabel("Equipment lookup", { exact: true }).fill("lift");
  assert.match(await lookup.innerText(), /Clarify which equipment type/);
  assert.equal(await lookup.getByRole("button", { name: /confirm request/ }).count(), 2);
  await page.getByLabel("Equipment lookup", { exact: true }).fill("unknown equipment");
  assert.match(await lookup.innerText(), /No recorded equipment matches/);
  assert.equal(await lookup.getByRole("button", { name: /confirm request/ }).count(), 0);
  await page.getByRole("button", { name: "1 · Ready to rent", exact: true }).click();
  assert.match(await panel.innerText(), /Rental Ready/);
  await page.getByRole("button", { name: "2 · Blocked rental", exact: true }).click();
  assert.match(await panel.innerText(), /Remediation Required/);
  await page.getByRole("button", { name: "3 · Ready with conditions", exact: true }).click();
  assert.match(await panel.innerText(), /Rental Ready with Conditions/);
  console.log("PASS all seven units: dropdown, normalized ID and serial search agree; ambiguous/unmatched search and walkthrough examples");
  await page.getByRole("button", { name: "1 · Ready to rent", exact: true }).click();
  await page.getByRole("button", { name: "Protect for four hours", exact: true }).click();
  await page.getByRole("button", { name: "Approve proposal", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Record customer acceptance", exact: true }).isDisabled(), false);
  await page.getByLabel("Equipment list", { exact: true }).selectOption("EQ-1002");
  await page.getByRole("button", { name: "Confirm selected equipment", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Record customer acceptance", exact: true }).isDisabled(), true);
  assert.match(await main.innerText(), /Skid steer loader/);
  assert.match(await panel.innerText(), /Remediation Required/);
  await main.getByText("All matching equipment and allocation history", { exact: true }).click();
  assert.match(await main.innerText(), /EQ-1002 · Remediation Required/);
  console.log("PASS changing selected equipment reevaluates readiness and invalidates prior approval");
  await page.reload({ waitUntil: "networkidle" });
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
  assert.match(
    await panel.innerText(),
    /Rental confirmed for your requested dates/,
  );
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
  assert.match(await panel.innerText(), /Sep 15, 2026, 10:00 AM Pacific/);
  assert.doesNotMatch(await panel.innerText(), /2026-09-15T10:00:00/);
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
  await page.reload({ waitUntil: "networkidle" });
  await page
    .getByRole("combobox", { name: /Demo request/ })
    .selectOption("REQ-SCN-004");
  await page
    .getByLabel("Decision reason", { exact: true })
    .fill("Customer accepts disclosed service stop");
  await page
    .getByLabel("Evidence reference", { exact: true })
    .fill("UI-SMOKE-SERVICE-ACCEPTANCE");
  for (const name of [
    "Protect for four hours",
    "Approve proposal",
    "Record customer acceptance",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
  }
  assert.match(
    await panel.innerText(),
    /Rental confirmed\. Required service\/replacement conditions have been accepted/,
  );
  assert.doesNotMatch(await panel.innerText(), /Confirm customer acceptance/);
  await panel.locator("details summary").click();
  assert.match(
    await panel.innerText(),
    /Customer acceptance recorded\. Required service stop remains in force/,
  );
  console.log(
    "PASS readable service times and confirmation wording after acceptance",
  );
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
    .getByRole("button", { name: "Protect for four hours", exact: true })
    .click();
  const acceptance = page.getByRole("button", {
    name: "Record customer acceptance",
    exact: true,
  });
  assert.equal(await acceptance.isDisabled(), true);
  await page
    .getByRole("button", { name: "Approve proposal", exact: true })
    .click();
  assert.equal(await acceptance.isDisabled(), false);
  await acceptance.click();
  assert.match(await panel.innerText(), /EQ-1002 · Confirmed/);
  console.log(
    "PASS renewed protection requires fresh staff approval before enabling acceptance",
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
