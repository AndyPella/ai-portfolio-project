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

  await page.goto(base + "/workspace", { waitUntil: "networkidle" });
  const main = page.locator("#customer-service"), summary = page.getByLabel("Current rental summary"), agreement = page.locator("#product-agreement");
  const role = async id => page.getByRole("combobox", { name: /Working as/i }).selectOption(id);
  const tools = async () => { if (!await page.getByRole("combobox", { name: /Demo request/i }).isVisible()) await page.getByText("Demo tools & sample inquiries", { exact: true }).click(); };
  const scenario = async id => { await tools(); await page.getByRole("combobox", { name: /Demo request/i }).selectOption(id); };
  const fresh = async () => page.reload({ waitUntil: "networkidle" });
  const confirm = async () => {
    const evidence = page.locator("#action-evidence");
    await evidence.waitFor();
    await evidence.getByLabel("Decision reason", { exact: true }).fill("Reviewed fictional rental details and supporting records");
    await evidence.getByLabel("Evidence reference", { exact: true }).fill("UI-PRODUCT-REVIEW");
    await evidence.getByRole("button", { name: "Confirm action", exact: true }).click();
    await evidence.waitFor({ state: "detached" });
  };
  const record = async name => { await page.getByRole("button", { name, exact: true }).click(); await confirm(); };
  const proceed = async () => { await page.getByRole("button", { name: "Proceed to rent →", exact: true }).click(); assert.equal(await page.getByRole("dialog").count(), 0); };
  assert.match(await summary.innerText(), /Not identified yet/);
  await page.getByRole("button", { name: "Finish inquiry", exact: true }).click();
  assert.match(await page.getByRole("status").innerText(), /No equipment was allocated/);
  // Empty calendar fields must not crash the interface; invalid requests still fail validation.
  await page.getByLabel("Pickup · Pacific", { exact: true }).fill("");
  await page.getByRole("button", { name: "Check requested availability", exact: true }).click();
  assert.match(await page.getByRole("status").innerText(), /Invalid|timestamp|pickup/i);
  await fresh();
  await page.getByRole("button", { name: "Check requested availability", exact: true }).click();
  assert.equal(await page.locator("#action-evidence").count(), 0);
  await proceed();
  assert.match(await summary.innerText(), /EQ-1001 · Temporary/);
  assert.equal(await page.getByRole("button", { name: "New customer", exact: true }).isEnabled(), true);
  for (const route of ["New customer", "Match uncertain", "Existing customer"]) {
    await page.getByRole("button", { name: route, exact: true }).click();
    assert.equal(await page.locator("#action-evidence").count(), 0);
  }
  await page.getByLabel(/Delivery \/ Pickup Notes/i).fill("Retained draft delivery instructions");
  await role("DEMO-MECH");
  assert.equal(await page.getByRole("button", { name: "Record passed demo safety checks", exact: true }).isVisible(), true);
  assert.equal(await page.getByRole("button", { name: "Reconcile conflicting records", exact: true }).isVisible(), false);
  assert.equal(await page.locator("#product-customer").isVisible(), false);
  await role("DEMO-MGR");
  assert.equal(await page.getByRole("button", { name: "Reconcile conflicting records", exact: true }).isVisible(), true);
  await role("DEMO-CS");
  assert.equal(await page.getByLabel(/Delivery \/ Pickup Notes/i).inputValue(), "Retained draft delivery instructions");
  // Selecting a real sample customer uses the shared intake rather than an invented CRM integration.
  await page.getByLabel("Find sample customer", { exact: true }).fill("CUS-002");
  const match = page.locator(".customer-search").getByRole("button").first();
  await match.click();
  assert.match(await summary.innerText(), /CUS-002/);
  assert.equal(await page.locator("#action-evidence").count(), 0);
  console.log("PASS availability-only inquiry, routine progression, actual sample lookup, role visibility and retained draft entries");
  await fresh();
  const units = [["EQ-1001", "NSR-KX040-001"], ["EQ-1002", "NSR-S66-014"], ["EQ-1003", "NSR-450AJ-008"], ["EQ-1004", "NSR-G70-021"], ["EQ-1005", "NSR-GTH-019"], ["EQ-1006", "NSR-DPU-044"], ["EQ-1007", "NSR-GS2646-032"]];
  const search = page.locator(".inline-search");
  await search.locator("summary").click();
  assert.equal(await page.getByLabel("Equipment list", { exact: true }).locator("option").count(), 7);
  for (const [i, [id, serial]] of units.entries()) {
    await scenario(`REQ-SCN-00${i + 1}`);
    await page.getByLabel("Equipment list", { exact: true }).selectOption(id);
    const expected = await summary.innerText();
    for (const query of [id.toLowerCase().replace("-", " "), serial]) {
      await page.getByLabel("Equipment lookup", { exact: true }).fill(query);
      await search.getByRole("button", { name: new RegExp(`^${id} ·`) }).click();
      assert.equal(await page.locator("#action-evidence").count(), 0);
      assert.equal(await summary.innerText(), expected);
    }
  }
  await page.getByLabel("Equipment lookup", { exact: true }).fill("lift");
  assert.match(await search.innerText(), /Clarify which equipment type/);
  await page.getByLabel("Equipment lookup", { exact: true }).fill("unknown equipment");
  assert.match(await search.innerText(), /No recorded equipment matches/);
  console.log("PASS all seven actual units: list, normalized ID and serial search; no invented result or evidence pop-up");
  await fresh();await proceed();
  assert.match(await main.innerText(), /Billing address:/);
  assert.match(await main.innerText(), /Northstar Demo Insurance/);
  await page.getByRole("checkbox", { name: "Identity verified", exact: true }).click();
  assert.equal(await page.getByRole("dialog").count(),0);
  await page.locator("#action-evidence").getByRole("button",{name:"Back without recording",exact:true}).click();
  assert.equal(await page.getByRole("checkbox", { name: "Identity verified", exact: true }).isChecked(),true);
  await page.getByRole("button", { name: "Review rental agreement →", exact: true }).click();
  await record("Approve proposal");await record("Record customer acceptance");
  assert.match(await summary.innerText(), /Confirmed rental/);
  await tools();await page.getByRole("button", { name: "Advance four hours", exact: true }).click();
  assert.match(await summary.innerText(), /EQ-1001 · Confirmed/);
  console.log("PASS inline evidence, checkbox cancellation, staff approval and customer acceptance, confirmed protection retention");
  await fresh();await scenario("REQ-SCN-004");
  assert.match(await summary.innerText(), /Rental Ready with Conditions/);
  assert.match(await page.locator("#product-equipment").innerText(), /Sep 15, 2026, 10:00 AM Pacific/);
  await proceed();await page.getByRole("button", { name: "Review rental agreement →", exact: true }).click();
  await record("Approve proposal");await record("Record customer acceptance");
  assert.match(await summary.innerText(), /Accepted service conditions remain in force/);
  await fresh();await scenario("REQ-SCN-004");await proceed();await page.getByRole("button", { name: "Review rental agreement →", exact: true }).click();
  await agreement.getByRole("button", { name: "Record customer decline", exact: true }).click();await confirm();
  assert.match(await summary.innerText(), /Not Available/);
  console.log("PASS disclosed service conditions and acceptance/decline branches");
  await fresh();await scenario("REQ-SCN-002");
  assert.match(await summary.innerText(), /Remediation Required/);
  assert.equal(await page.getByRole("button", { name: "Proceed to rent →", exact: true }).isDisabled(), true);
  await page.getByRole("button", { name: "Review blocker details →", exact: true }).click();
  assert.equal(await page.locator("#readiness-findings").getAttribute("open"), "");
  await role("DEMO-MECH");await record("Record passed demo safety checks");
  assert.match(await summary.innerText(), /Remediation Required/);
  await record("Release selected hold");assert.match(await summary.innerText(), /Rental Ready/);
  await role("DEMO-CS");await proceed();await page.getByRole("button", { name: "Review rental agreement →", exact: true }).click();
  await record("Approve proposal");await tools();await page.getByRole("button", { name: "Advance four hours", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Record customer acceptance", exact: true }).isDisabled(), true);
  await record("Protect for four hours");
  assert.equal(await page.getByRole("button", { name: "Record customer acceptance", exact: true }).isDisabled(), true);
  await record("Approve proposal");await record("Record customer acceptance");
  console.log("PASS blocker review, separate qualified inspection/hold release, exact expiry and renewed approval");
  await fresh();await scenario("REQ-SCN-007");await proceed();await page.getByRole("button", { name: "Review rental agreement →", exact: true }).click();await record("Approve proposal");
  assert.equal(await page.getByRole("button", { name: "Record customer acceptance", exact: true }).isDisabled(), true);
  await fresh();await proceed();await page.getByRole("button", { name: "Review rental agreement →", exact: true }).click();await record("Approve proposal");
  await page.getByLabel("Equipment list", { exact: true }).selectOption("EQ-1002");
  assert.equal(await page.getByRole("button", { name: "Record customer acceptance", exact: true }).isDisabled(), true);
  console.log("PASS customer checks and changed-equipment approval invalidation");
  for (const width of [1440,390]) {
    await page.setViewportSize({width,height:900});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(process.env.UI_SCREENSHOT_DIR)await page.screenshot({path:process.env.UI_SCREENSHOT_DIR+`/product-${width}.png`});
  }
  assert.deepEqual(errors,[]);
  console.log("PASS desktop/mobile layout and no browser page errors");
} catch (error) {
  console.error(output);
  throw error;
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
