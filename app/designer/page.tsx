import { requireChatGPTUser } from "../chatgpt-auth";
import DesignerStudio from "./designer-studio";

export const dynamic = "force-dynamic";

export default async function DesignerPage() {
  await requireChatGPTUser("/designer");
  return <DesignerStudio />;
}
