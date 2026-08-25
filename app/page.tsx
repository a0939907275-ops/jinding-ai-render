import RenderStudio from "./render-studio";
import { requireChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireChatGPTUser("/");
  return <RenderStudio initialMode="general" />;
}
