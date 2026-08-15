import CustomerStudio from "./customer-studio";
import { requireChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireChatGPTUser("/");
  return <CustomerStudio />;
}
