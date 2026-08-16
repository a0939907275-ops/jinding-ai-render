# 金鼎室內改造 MVP 專案背景

更新日期：2026-08-16

GitHub：`a0939907275-ops/jinding-ai-render`

## 專案目標

提供客戶與設計師使用的 AI 室內改造工具，並將改造任務與結果同步到金鼎 AI 控制中心。

## 已完成能力

- 客戶工作室與設計師工作室介面。
- 上傳 JPG、PNG、WEBP 空間照片。
- 使用 OpenAI GPT Image 2 分析空間、建立設計、生成改造圖與修改設計。
- 自訂風格研究、圖片標註及燈光線條工具。
- `POST /api/renders` 將 created、processing、completed、failed 狀態同步到控制中心。
- 正式環境使用 `JINDING_PLATFORM_URL`、`JINDING_INTEGRATION_SECRET` 與伺服器端 `OPENAI_API_KEY`。

## AI API

- `/api/analyze-space`
- `/api/create-design`
- `/api/research-style`
- `/api/render`
- `/api/revise`

## 中央控制中心串接

- `/api/renders` 接收改造任務狀態，再以事件寫入控制中心 `/api/events`。
- 共用 Webhook Secret 僅用於系統間驗證，不取代 OpenAI API 金鑰。
- OpenAI 金鑰只放在本機忽略檔與 Vercel Sensitive 環境變數，不提交 Git。

## 開發指令

```text
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm check:integration
```

## 後續工作

1. 驗證完整 AI 圖片生成流程。
2. 將完成的生成結果自動回寫控制中心 Renders。
3. 確認 Vercel 與 Sites 的部署入口和環境變數一致。
4. 維持人工確認後再交付客戶，不自動發送結果。
