import { requireChatGPTUser } from "../chatgpt-auth";
import DesignerStudio from "./designer-studio";
import FontSizeControl from "../font-size-control";

export const dynamic = "force-dynamic";

export default async function DesignerPage() {
  await requireChatGPTUser("/designer");
  return <><FontSizeControl /><DesignerStudio /></>;
}
