import { failure, openAI, validateImage } from "../../../lib/openai";
import { renderPrompt } from "../../../lib/prompt-engine";
import { requireApiUser } from "../../../lib/require-api-user";
import { validateTextFields } from "../../../lib/validate-input";
import { syncRenderEvent } from "../../../lib/control-center";

export async function POST(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  const externalId = `render-${crypto.randomUUID()}`;
  const fields: Record<string, string> = {};

  try {
    const input = await request.formData();
    const image = validateImage(input.get("image"));
    input.forEach((value, key) => {
      if (typeof value === "string") fields[key] = value;
    });
    validateTextFields(fields);

    await syncRenderEvent({
      externalId,
      status: "processing",
      projectName: fields.projectName,
      roomType: fields.roomType,
      prompt: fields.design,
      style: fields.style,
    });

    const quality = fields.audience === "customer" ? "medium" : "high";
    const body = new FormData();
    body.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-2");
    body.append("image", image);
    body.append("prompt", renderPrompt(fields));
    body.append("quality", quality);
    body.append("size", "auto");
    body.append("output_format", "webp");

    const json = await openAI("/images/edits", { method: "POST", body });
    const encoded = json.data?.[0]?.b64_json;
    if (!encoded) throw new Error("影像模型沒有回傳結果");

    await syncRenderEvent({
      externalId,
      status: "completed",
      projectName: fields.projectName,
      roomType: fields.roomType,
      prompt: fields.design,
      style: fields.style,
    });
    return Response.json({ image: `data:image/webp;base64,${encoded}`, externalId });
  } catch (error) {
    await syncRenderEvent({
      externalId,
      status: "failed",
      projectName: fields.projectName,
      roomType: fields.roomType,
      prompt: fields.design,
      style: fields.style,
      errorMessage: error instanceof Error ? error.message : "AI 處理失敗",
    });
    return failure(error);
  }
}
