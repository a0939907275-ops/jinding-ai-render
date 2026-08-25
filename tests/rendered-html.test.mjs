import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("MVP exposes the required workflow and API routes", async () => {
  const page = await readFile(new URL("../app/render-studio.tsx", import.meta.url), "utf8");
  for (const text of ["一般模式", "專業模式", "上傳現場照片", "奶茶奢華", "保留", "移除", "新增", "/api/analyze-space", "/api/create-design", "/api/render", "/api/revise"]) assert.match(page, new RegExp(text));
  for (const route of ["analyze-space", "create-design", "render", "revise", "research-style"]) assert.match(await readFile(new URL(`../app/api/${route}/route.ts`, import.meta.url), "utf8"), /export async function POST/);
});

test("prompt engine preserves geometry and supports three layers", async () => {
  const prompts = await readFile(new URL("../lib/prompt-engine.ts", import.meta.url), "utf8");
  for (const layer of ["SPACE_ANALYZER", "DESIGN_DIRECTOR", "RENDER_DIRECTOR"]) assert.match(prompts, new RegExp(layer));
  assert.match(prompts, /camera perspective, framing and spatial proportions/); assert.match(prompts, /不得新增、刪除或移動房間/);
  assert.match(prompts, /Do not preserve existing furniture unless required by the user/);
  assert.match(prompts, /使用者明確要求/);
});

test("general mode locks architecture without locking interior design", async () => {
  const studio = await readFile(new URL("../app/render-studio.tsx", import.meta.url), "utf8");
  const designRoute = await readFile(new URL("../app/api/create-design/route.ts", import.meta.url), "utf8");
  assert.match(studio, /structureLock: "true"/);
  assert.match(studio, /mode === "professional" && cabinetLock/);
  assert.match(designRoute, /input\.modelLock === true \|\| input\.modelLock === "true"/);
});

test("designer annotations support precise SVG lines, endpoint movement and copying", async () => {
  const annotator = await readFile(new URL("../app/designer/image-annotator.tsx", import.meta.url), "utf8");
  for (const text of ["annotation-lines", "preserveAspectRatio=\"none\"", 'handle:"whole"|"start"|"end"', "複製", "onPointerCancel"]) assert.match(annotator, new RegExp(text));
});

test("both modes share one studio and revisions continue from the previous version", async () => {
  const studio = await readFile(new URL("../app/render-studio.tsx", import.meta.url), "utf8");
  const customerPage = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const designerPage = await readFile(new URL("../app/designer/page.tsx", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/revise/route.ts", import.meta.url), "utf8");
  assert.match(customerPage, /RenderStudio/); assert.match(designerPage, /RenderStudio/);
  assert.match(studio, /revisionHistory/); assert.match(studio, /fetch\(result\)/); assert.match(studio, /versions/);
  assert.match(route, /上一版渲染結果/); assert.match(route, /validateTextFields/);
});

test("general rendering uses the faster medium tier while professional stays high", async () => {
  const studio = await readFile(new URL("../app/render-studio.tsx", import.meta.url), "utf8");
  const render = await readFile(new URL("../app/api/render/route.ts", import.meta.url), "utf8");
  assert.match(studio, /mode === "general" \? "customer" : "professional"/);
  assert.match(render, /fields\.audience === "customer" \? "medium" : "high"/);
});
