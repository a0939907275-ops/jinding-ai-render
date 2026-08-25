import { failure, openAI, responseText } from "../../../lib/openai";
import { DESIGN_DIRECTOR } from "../../../lib/prompt-engine";
import { requireApiUser } from "../../../lib/require-api-user";
import { validateTextFields } from "../../../lib/validate-input";

export async function POST(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;
  try {
    const input = await request.json();
    validateTextFields(Object.fromEntries(Object.entries(input).filter((entry): entry is [string,string] => typeof entry[1] === "string")));
    const brief = `空間分析：${input.analysis}\n風格：${input.style}\n色系：${input.colorScheme || "依風格"}\n燈光：${input.basicLighting || "依風格"}\n保留：${input.keep || "僅鎖定建築格局"}\n移除：${input.remove || "未指定"}\n新增：${input.add || "依風格完整設計"}\n使用者明確要求（優先於風格）：${input.other || "未指定"}`;
    const modelLock = input.modelLock === true || input.modelLock === "true";
    const instructions = modelLock ? `${DESIGN_DIRECTOR}\n\n本次開啟專業模型鎖定。依 renderMode 與圖片定位備註限制修改範圍；只有 strict 模式才鎖定所有模型幾何。其他模式仍可在允許範圍重新設計家具、櫃體外觀、材質與燈光。` : DESIGN_DIRECTOR;
    const json = await openAI("/responses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_TEXT_MODEL || "gpt-5-mini", instructions, input: `${brief}\n圖片定位備註：${input.annotations || "無"}` }) });
    return Response.json({ design: responseText(json) });
  } catch (error) { return failure(error); }
}
