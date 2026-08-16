export function apiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("伺服器尚未設定 OPENAI_API_KEY");
  return key;
}

export async function openAI(path: string, init: RequestInit) {
  const response = await fetch(`https://api.openai.com/v1${path}`, { ...init, headers: { Authorization: `Bearer ${apiKey()}`, ...(init.headers || {}) } });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error?.message || "OpenAI API request failed");
  return json;
}

type OutputItem = { content?: Array<{ text?: string }> };
export function responseText(json: { output_text?: string; output?: OutputItem[] }) {
  return json.output_text || json.output?.flatMap(item => item.content || []).find(item => item.text)?.text || "";
}

export function imageSize(file: File) { return file.type === "image/webp" ? "image/webp" : file.type === "image/png" ? "image/png" : "image/jpeg"; }
export function failure(error: unknown) { return Response.json({ error: error instanceof Error ? error.message : "AI 處理失敗" }, { status: 500 }); }

const allowedImages = new Set(["image/jpeg", "image/png", "image/webp"]);
export function validateImage(value: FormDataEntryValue | null): File {
  if (!(value instanceof File)) throw new Error("缺少圖片");
  if (!allowedImages.has(value.type)) throw new Error("僅支援 JPG、PNG 或 WEBP 圖片");
  if (value.size === 0 || value.size > 15 * 1024 * 1024) throw new Error("圖片大小必須介於 1 byte 至 15 MB");
  return value;
}
