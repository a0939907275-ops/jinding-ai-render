import { getChatGPTUser } from "../app/chatgpt-auth";

export async function requireApiUser(): Promise<Response | null> {
  const user = await getChatGPTUser();
  if (user) return null;

  return Response.json(
    { error: "請先註冊或登入帳號後再使用 AI 設計功能。" },
    { status: 401 },
  );
}
