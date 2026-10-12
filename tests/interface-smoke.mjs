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

  const main = page.locator("#customer-service"), panel = main.locator(".decision-panel");
  const nav = async name => {
    const labels = { "Customer & request": "2 · Customer identification", "Equipment & readiness": "1 · Equipment availability", "Agreement & confirmation": "3 · Rental agreement" };
    const button = page.getByRole("navigation", { name: "Rental functions" }).getByRole("button", { name: labels[name] ?? name, exact: true });
    if (await button.isDisabled()) await record("Proceed to rent · protect equipment");
    await button.click();
  };
  const role = async id => page.getByRole("combobox", { name: /Acting staff/ }).selectOption(id);
  const scenario = async id => page.getByRole("combobox", { name: /Demo request/ }).selectOption(id);
  const fresh = async () => page.reload({ waitUntil: "networkidle" });
  const record = async name => {
    await page.getByRole("button", { name, exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    await dialog.getByLabel("Decision reason", { exact: true }).fill("Reviewed fictional scenario and required evidence");
    await dialog.getByLabel("Evidence reference", { exact: true }).fill("UI-SMOKE-EVIDENCE");
    await dialog.getByRole("button", { name: "Confirm action", exact: true }).click();
    await dialog.waitFor({ state: "detached" });
  };
  const lookup = main.locator("details").filter({ has: page.getByText("Change equipment · search or equipment list", { exact: true }) });
  assert.equal(await page.getByRole("button", { name: "Record passed demo safety checks", exact: true }).isVisible(), false);
  assert.match(await main.locator(".section-guidance").innerText(), /Equipment availability/);
  assert.equal(await page.getByRole("navigation", { name: "Rental functions" }).getByRole("button", { name: "2 · Customer identification", exact: true }).isDisabled(), true);
  await page.getByRole("button", { name: "Finish availability check", exact: true }).click();
  assert.match(await page.getByRole("status").innerText(), /No equipment was allocated/);
  assert.match(await main.locator(".rental-context").innerText(), /Availability inquiry/);
  await record("Proceed to rent · protect equipment");
  assert.match(await main.locator(".section-guidance").innerText(), /Customer identification/);
  await nav("Customer & request");
  await page.getByText("Edit shared intake and rental details", { exact: true }).click();
  await page.getByLabel(/Delivery \/ pickup notes/).fill("Retained unsaved delivery note");
  await nav("Equipment & readiness");
  await role("DEMO-MECH");
  assert.equal(await page.getByRole("button", { name: "Record passed demo safety checks", exact: true }).isVisible(), true);
  assert.equal(await page.getByRole("button", { name: "Reconcile conflicting records", exact: true }).isVisible(), false);
  assert.equal(await page.getByRole("navigation", { name: "Rental functions" }).getByRole("button", { name: "2 · Customer identification", exact: true }).count(), 0);
  await role("DEMO-MGR");
  assert.equal(await page.getByRole("button", { name: "Reconcile conflicting records", exact: true }).isVisible(), true);
  assert.equal(await page.getByRole("navigation", { name: "Rental functions" }).getByRole("button").count(), 4);
  await role("DEMO-CS");
  await nav("Customer & request");
  assert.equal(await page.getByLabel(/Delivery \/ pickup notes/).inputValue(), "Retained unsaved delivery note");
  console.log("PASS role-specific visibility, manager sections and retained draft context");
  await page.getByRole("combobox", { name: /Customer route/ }).selectOption("New");
  await page.getByRole("dialog").getByRole("button", { name: "Confirm action", exact: true }).click();
  assert.match(await main.innerText(), /Apply the existing new-customer workflow/);
  await page.getByRole("combobox", { name: /Customer route/ }).selectOption("Existing");
  await page.getByRole("dialog").getByRole("button", { name: "Confirm action", exact: true }).click();
  await nav("Agreement & confirmation");assert.match(await panel.innerText(), /EQ-1001 · Temporary/);
  console.log("PASS availability-only exit, temporary protection before intake, existing/new customer branching");
  await fresh();
  await nav("Equipment & readiness");
  await lookup.locator("summary").click();
  const units = [["EQ-1001", "NSR-KX040-001"], ["EQ-1002", "NSR-S66-014"], ["EQ-1003", "NSR-450AJ-008"], ["EQ-1004", "NSR-G70-021"], ["EQ-1005", "NSR-GTH-019"], ["EQ-1006", "NSR-DPU-044"], ["EQ-1007", "NSR-GS2646-032"]];
  assert.equal(await page.getByLabel("Equipment list", { exact: true }).locator("option").count(), 8);
  for (const [i, [id, serial]] of units.entries()) {
    await scenario(`REQ-SCN-00${i + 1}`);
    await page.getByLabel("Equipment list", { exact: true }).selectOption(id);
    await record("Confirm selected equipment");
    const expected = await panel.innerText();
    for (const query of [id.toLowerCase().replace("-", " "), serial]) {
      await page.getByLabel("Equipment lookup", { exact: true }).fill(query);
      await lookup.getByRole("button", { name: new RegExp(`^${id} ·`) }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Confirm action", exact: true }).click();
      assert.equal(await panel.innerText(), expected);
    }
  }
  await page.getByLabel("Equipment lookup", { exact: true }).fill("lift");
  assert.match(await lookup.innerText(), /Clarify which equipment type/);
  await page.getByLabel("Equipment lookup", { exact: true }).fill("unknown equipment");
  assert.match(await lookup.innerText(), /No recorded equipment matches/);
  console.log("PASS seven-unit dropdown, ID and serial equivalence; ambiguous and unmatched search");
  await fresh();
  await page.locator("#guided-walkthrough summary").click();
  for (const [name, id] of [["1 · Ready to rent", "EQ-1001"], ["2 · Blocked rental", "EQ-1002"], ["3 · Ready with conditions", "EQ-1004"]]) {
    await page.getByRole("button", { name, exact: true }).click();
    assert.match(await main.locator(".rental-context").innerText(), new RegExp(id));
  }
  console.log("PASS examples load request and equipment without redundant selection");
  await fresh();
  await page.getByRole("button", { name: "Proceed to rent · protect equipment", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  assert.equal(await page.getByRole("dialog").getByRole("button", { name: "Confirm action", exact: true }).isDisabled(), true);
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await nav("Agreement & confirmation");
  for (const name of ["Protect for four hours", "Approve proposal", "Record customer acceptance"]) await record(name);
  assert.match(await panel.innerText(), /EQ-1001 · Confirmed/);
  await page.getByRole("button", { name: "Advance four hours", exact: true }).click();
  assert.match(await panel.innerText(), /EQ-1001 · Confirmed/);
  console.log("PASS action-specific evidence, Escape cancellation and confirmed allocation retention");
  await fresh();await scenario("REQ-SCN-004");await nav("Agreement & confirmation");
  assert.match(await panel.innerText(), /Sep 15, 2026, 10:00 AM Pacific/);
  for (const name of ["Protect for four hours", "Approve proposal", "Record customer acceptance"]) await record(name);
  assert.match(await panel.innerText(), /Rental confirmed\. Required service\/replacement conditions have been accepted/);
  await panel.locator("details summary").click();
  assert.match(await panel.innerText(), /Customer acceptance recorded/);
  await fresh();await scenario("REQ-SCN-004");await nav("Agreement & confirmation");await record("Record customer decline");
  assert.match(await panel.innerText(), /Not Available/);
  console.log("PASS service disclosure, acceptance and decline branches");
  await fresh();await scenario("REQ-SCN-002");await nav("Equipment & readiness");assert.match(await panel.innerText(), /Remediation Required/);
  await role("DEMO-MECH");await record("Record passed demo safety checks");
  await nav("Equipment & readiness");assert.match(await panel.innerText(), /Remediation Required/);
  await nav("Review & resolution");await record("Release selected hold");
  await nav("Equipment & readiness");assert.match(await panel.innerText(), /Rental Ready/);
  await role("DEMO-CS");await nav("Agreement & confirmation");await record("Protect for four hours");await record("Approve proposal");
  await page.getByRole("button", { name: "Advance four hours", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Record customer acceptance", exact: true }).isDisabled(), true);
  await record("Protect for four hours");assert.equal(await page.getByRole("button", { name: "Record customer acceptance", exact: true }).isDisabled(), true);
  await record("Approve proposal");await record("Record customer acceptance");assert.match(await panel.innerText(), /EQ-1002 · Confirmed/);
  console.log("PASS qualified inspection, separate hold release, expiry and fresh approval");
  await fresh();await nav("Agreement & confirmation");await record("Protect for four hours");await record("Approve proposal");
  await nav("Equipment & readiness");await lookup.locator("summary").click();await page.getByLabel("Equipment list", { exact: true }).selectOption("EQ-1002");await record("Confirm selected equipment");
  assert.match(await panel.innerText(), /Remediation Required/);await nav("Agreement & confirmation");assert.equal(await page.getByRole("button", { name: "Record customer acceptance", exact: true }).isDisabled(), true);
  await fresh();await scenario("REQ-SCN-007");await nav("Agreement & confirmation");await record("Protect for four hours");await record("Approve proposal");assert.equal(await page.getByRole("button", { name: "Record customer acceptance", exact: true }).isDisabled(), true);
  console.log("PASS changed selection invalidates approval; customer paperwork remains a separate gate");
  for (const width of [1440,390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const section of ["Customer & request","Equipment & readiness","Agreement & confirmation","Review & resolution"]) {await nav(section);assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false);}
    await nav("Equipment & readiness");
    await page.evaluate(() => document.querySelector(".rental-context").scrollIntoView());
    if(process.env.UI_SCREENSHOT_DIR)await page.screenshot({path:process.env.UI_SCREENSHOT_DIR+`/workspace-${width}.png`});
  }
  assert.deepEqual(errors,[]);
  console.log("PASS desktop/mobile sections, no horizontal overflow or browser errors");
} catch (error) {
  console.error(output);
  throw error;
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
