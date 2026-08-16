import { failure, openAI, validateImage } from "../../../lib/openai";
import { RENDER_DIRECTOR } from "../../../lib/prompt-engine";
import { renderPrompt } from "../../../lib/prompt-engine";
import { requireApiUser } from "../../../lib/require-api-user";
import { validateTextFields } from "../../../lib/validate-input";

export async function POST(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;
  try {
    const input = await request.formData(); const image = validateImage(input.get("image")); const revision = String(input.get("revision") || "").trim();
    if (!revision || revision.length > 1000) return Response.json({ error: "修改需求必須介於 1 至 1000 字" }, { status: 400 });
    const fields: Record<string,string> = {}; input.forEach((value,key) => { if (typeof value === "string") fields[key] = value; });
    validateTextFields(fields);
    const history = fields.revisionHistory || revision;
    const prompt = fields.modelLock === "true" ? renderPrompt({ ...fields, design: `${fields.design || ""}\n從原始圖片重新套用以下累積修改；未列出的模型、結構、比例與視角完全不變：\n${history}` }) : `${RENDER_DIRECTOR}\n以原始圖片為基準套用以下累積修改：\n${history}\n原設計脈絡：${fields.design || ""}`;
    const quality = fields.audience === "customer" ? "medium" : "high";
    const body = new FormData(); body.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-2"); body.append("image", image); body.append("prompt", prompt); body.append("quality", quality); body.append("size", "auto"); body.append("output_format", "webp");
    const json = await openAI("/images/edits", { method: "POST", body }); const encoded = json.data?.[0]?.b64_json; if (!encoded) throw new Error("影像模型沒有回傳結果");
    return Response.json({ image: `data:image/webp;base64,${encoded}` });
  } catch (error) { return failure(error); }
}
