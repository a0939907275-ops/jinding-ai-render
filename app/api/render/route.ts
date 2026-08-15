import { failure, openAI, validateImage } from "../../../lib/openai";
import { renderPrompt } from "../../../lib/prompt-engine";
import { requireApiUser } from "../../../lib/require-api-user";

export async function POST(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;
  try {
    const input = await request.formData(); const image = validateImage(input.get("image"));
    const fields: Record<string,string> = {}; input.forEach((value,key) => { if (typeof value === "string") fields[key] = value; });
    const body = new FormData(); body.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-2"); body.append("image", image); body.append("prompt", renderPrompt(fields)); body.append("quality", "high"); body.append("size", "auto"); body.append("output_format", "webp"); body.append("input_fidelity", "high");
    const json = await openAI("/images/edits", { method: "POST", body });
    const encoded = json.data?.[0]?.b64_json; if (!encoded) throw new Error("影像模型沒有回傳結果");
    return Response.json({ image: `data:image/webp;base64,${encoded}` });
  } catch (error) { return failure(error); }
}
