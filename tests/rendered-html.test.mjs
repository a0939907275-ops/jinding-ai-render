import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("MVP exposes the required workflow and API routes", async () => {
  const page = await readFile(new URL("../app/customer-studio.tsx", import.meta.url), "utf8");
  for (const text of ["上傳現場照片", "奶茶奢華", "保留", "移除", "新增", "/api/analyze-space", "/api/create-design", "/api/render", "/api/revise"]) assert.match(page, new RegExp(text));
  for (const route of ["analyze-space", "create-design", "render", "revise", "research-style"]) assert.match(await readFile(new URL(`../app/api/${route}/route.ts`, import.meta.url), "utf8"), /export async function POST/);
});

test("prompt engine preserves geometry and supports three layers", async () => {
  const prompts = await readFile(new URL("../lib/prompt-engine.ts", import.meta.url), "utf8");
  for (const layer of ["SPACE_ANALYZER", "DESIGN_DIRECTOR", "RENDER_DIRECTOR"]) assert.match(prompts, new RegExp(layer));
  assert.match(prompts, /保留原始相機位置/); assert.match(prompts, /不得新增門窗或改變格局/);
});

test("designer annotations support precise SVG lines, endpoint movement and copying", async () => {
  const annotator = await readFile(new URL("../app/designer/image-annotator.tsx", import.meta.url), "utf8");
  for (const text of ["annotation-lines", "preserveAspectRatio=\"none\"", 'handle:"whole"|"start"|"end"', "複製", "onPointerCancel"]) assert.match(annotator, new RegExp(text));
});

test("revisions use the original image with cumulative instructions", async () => {
  const customer = await readFile(new URL("../app/customer-studio.tsx", import.meta.url), "utf8");
  const designer = await readFile(new URL("../app/designer/designer-studio.tsx", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/revise/route.ts", import.meta.url), "utf8");
  assert.match(customer, /revisionHistory/); assert.doesNotMatch(customer, /fetch\(result\)/);
  assert.match(designer, /revisionHistory/); assert.doesNotMatch(designer, /fetch\(result\)/);
  assert.match(route, /原始圖片/); assert.match(route, /validateTextFields/);
});

test("customer rendering uses the faster medium tier while designer stays high", async () => {
  const customer = await readFile(new URL("../app/customer-studio.tsx", import.meta.url), "utf8");
  const render = await readFile(new URL("../app/api/render/route.ts", import.meta.url), "utf8");
  assert.match(customer, /audience: "customer"/);
  assert.match(render, /fields\.audience === "customer" \? "medium" : "high"/);
});
