import { failure, openAI, validateImage } from "../../../lib/openai";
import { RENDER_DIRECTOR } from "../../../lib/prompt-engine";

export async function POST(request: Request) {
  try {
    const input = await request.formData(); const image = validateImage(input.get("image")); const revision = String(input.get("revision") || "").trim();
    if (!revision || revision.length > 1000) return Response.json({ error: "修改需求必須介於 1 至 1000 字" }, { status: 400 });
    const body = new FormData(); body.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5"); body.append("image", image); body.append("prompt", `${RENDER_DIRECTOR}\n這是上一版改造圖。只套用以下修改，其餘已完成設計保持不變：${revision}\n原設計脈絡：${String(input.get("design") || "")}`); body.append("quality", "high"); body.append("size", "auto"); body.append("output_format", "webp"); body.append("input_fidelity", "high");
    const json = await openAI("/images/edits", { method: "POST", body }); const encoded = json.data?.[0]?.b64_json; if (!encoded) throw new Error("影像模型沒有回傳結果");
    return Response.json({ image: `data:image/webp;base64,${encoded}` });
  } catch (error) { return failure(error); }
}
