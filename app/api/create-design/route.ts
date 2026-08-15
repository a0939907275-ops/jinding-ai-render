import { failure, openAI, responseText } from "../../../lib/openai";
import { DESIGN_DIRECTOR } from "../../../lib/prompt-engine";
import { requireApiUser } from "../../../lib/require-api-user";

export async function POST(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;
  try {
    const input = await request.json();
    const brief = `空間分析：${input.analysis}\n風格：${input.style}\n保留：${input.keep || "未指定"}\n移除：${input.remove || "未指定"}\n新增：${input.add || "未指定"}\n其他：${input.other || "未指定"}`;
    const instructions = input.modelLock ? `${DESIGN_DIRECTOR}\n\n本次是設計師 SketchUp 模型渲染，不是重新設計。不得提出移動、替換、增刪或改變任何既有模組的方案。只描述如何在完全相同的模型幾何、鏡頭和配置上提升材質、色彩、反射、燈光、陰影與攝影質感，並遵守圖片定位備註。` : DESIGN_DIRECTOR;
    const json = await openAI("/responses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_TEXT_MODEL || "gpt-5-mini", instructions, input: `${brief}\n圖片定位備註：${input.annotations || "無"}` }) });
    return Response.json({ design: responseText(json) });
  } catch (error) { return failure(error); }
}
