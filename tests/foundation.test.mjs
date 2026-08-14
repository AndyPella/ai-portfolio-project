import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("foundation exposes both planned role workspaces", () => {
  assert.match(page, />Customer Service</);
  assert.match(page, />Mechanic</);
});

test("foundation identifies its fictional data", () => {
  assert.match(page, /Demo uses fictional data/);
});
