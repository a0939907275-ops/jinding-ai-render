import { failure, openAI, responseText } from "../../../lib/openai";
import { requireApiUser } from "../../../lib/require-api-user";

export async function POST(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;

  try {
    const { style } = await request.json();
    const query = String(style || "").trim();
    if (!query || query.length > 300) {
      return Response.json({ error: "請輸入 1 到 300 字的自訂風格。" }, { status: 400 });
    }

    const json = await openAI("/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_SEARCH_MODEL || process.env.OPENAI_TEXT_MODEL || "gpt-5-mini",
        tools: [{ type: "web_search" }],
        tool_choice: "auto",
        include: ["web_search_call.action.sources"],
        input: `你是室內設計風格研究員。搜尋「${query}」的高品質室內設計案例與視覺參考，優先採用可信的建築、室內設計、家具與材料來源。整理成可直接交給圖片生成模型的繁體中文設計指令，包含色彩、材質、家具輪廓、收納、燈光、軟裝、配置原則與應避免的元素。保留原始房間建築結構與相機視角。不要模仿特定在世設計師或複製單一作品。`,
      }),
    });

    const research = responseText(json).trim();
    if (!research) throw new Error("找不到足夠的風格參考，請換一個描述再試一次。");
    return Response.json({ research });
  } catch (error) {
    return failure(error);
  }
}
