import {failure, openAI, responseText, validateImage} from "../../../lib/openai";
import {LAYOUT_PLANNER, layoutPlanSchema, validateLayoutPlan} from "../../../lib/layout-planning";
import {requireApiUser} from "../../../lib/require-api-user";
import {validateTextFields} from "../../../lib/validate-input";

export async function POST(request: Request) {
  const unauthorized = await requireApiUser();
  if (unauthorized) return unauthorized;
  try {
    const form = await request.formData();
    const image = validateImage(form.get("image"));
    const fields: Record<string,string> = {};
    form.forEach((value,key) => { if (typeof value === "string") fields[key] = value; });
    validateTextFields(fields);
    if (!fields.spaceType) return Response.json({error: "請選擇空間類型"}, {status: 400});
    const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    const requirements = `空間類型：${fields.spaceType}\n配置需求：${fields.requirements || "依空間類型提出完整配置"}\n鎖定家具：${fields.lockedItems || "無"}\n指定牆面：${fields.designatedWalls || "無"}\n單件重新配置：${fields.singleItem || "無，配置完整空間"}\n既有空間分析：${fields.analysis || "請依圖片分析"}\n圖片定位備註：${fields.annotations || "無"}`;
    const json = await openAI("/responses", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-5-mini",
      instructions: LAYOUT_PLANNER,
      input: [{role: "user", content: [{type: "input_text", text: requirements}, {type: "input_image", image_url: `data:${image.type};base64,${base64}`, detail: "high"}]}],
      text: {format: {type: "json_schema", name: "layout_plans", strict: true, schema: layoutPlanSchema}},
    })});
    const plan = validateLayoutPlan(JSON.parse(responseText(json)));
    return Response.json({plan});
  } catch (error) { return failure(error); }
}
