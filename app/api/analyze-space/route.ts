import { failure, openAI, responseText, validateImage } from "../../../lib/openai";
import { SPACE_ANALYZER } from "../../../lib/prompt-engine";
import { requireApiUser } from "../../../lib/require-api-user";

export async function POST(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;
  try {
    const form = await request.formData(); const image = validateImage(form.get("image"));
    const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    const json = await openAI("/responses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_TEXT_MODEL || "gpt-5-mini", input: [{ role: "system", content: [{ type: "input_text", text: SPACE_ANALYZER }] }, { role: "user", content: [{ type: "input_text", text: "請分析這個待改造空間。" }, { type: "input_image", image_url: `data:${image.type};base64,${base64}`, detail: "high" }] }] }) });
    return Response.json({ analysis: responseText(json) });
  } catch (error) { return failure(error); }
}
