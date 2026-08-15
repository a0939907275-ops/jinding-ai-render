import { failure, openAI, responseText } from "../../../lib/openai";
import { DESIGN_DIRECTOR } from "../../../lib/prompt-engine";

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const brief = `空間分析：${input.analysis}\n風格：${input.style}\n保留：${input.keep || "未指定"}\n移除：${input.remove || "未指定"}\n新增：${input.add || "未指定"}\n其他：${input.other || "未指定"}`;
    const json = await openAI("/responses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_TEXT_MODEL || "gpt-5-mini", instructions: DESIGN_DIRECTOR, input: brief }) });
    return Response.json({ design: responseText(json) });
  } catch (error) { return failure(error); }
}
