import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("MVP exposes the required workflow and API routes", async () => {
  const page = await readFile(new URL("../app/customer-studio.tsx", import.meta.url), "utf8");
  for (const text of ["上傳現場照片", "奶茶奢華", "保留", "移除", "新增", "/api/analyze-space", "/api/create-design", "/api/render", "/api/revise"]) assert.match(page, new RegExp(text));
  for (const route of ["analyze-space", "create-design", "render", "revise"]) assert.match(await readFile(new URL(`../app/api/${route}/route.ts`, import.meta.url), "utf8"), /export async function POST/);
});

test("prompt engine preserves geometry and supports three layers", async () => {
  const prompts = await readFile(new URL("../lib/prompt-engine.ts", import.meta.url), "utf8");
  for (const layer of ["SPACE_ANALYZER", "DESIGN_DIRECTOR", "RENDER_DIRECTOR"]) assert.match(prompts, new RegExp(layer));
  assert.match(prompts, /保留原始相機位置/); assert.match(prompts, /不得新增門窗或改變格局/);
});
