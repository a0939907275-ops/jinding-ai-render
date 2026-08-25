import { requireChatGPTUser } from "../chatgpt-auth";
import RenderStudio from "../render-studio";

export const dynamic = "force-dynamic";

export default async function DesignerPage() {
  await requireChatGPTUser("/designer");
  return <RenderStudio initialMode="professional" />;
}
