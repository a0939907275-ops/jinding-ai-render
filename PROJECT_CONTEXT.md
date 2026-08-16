# PROJECT_CONTEXT — 金鼎 AI 室內改造引擎

> 最後更新：2026-08-16  
> GitHub：`a0939907275-ops/jinding-ai-render`  
> 正式網站：`https://jinding-ai-space-studio.jding1491.chatgpt.site`

## 目前狀態

本專案已由早期 `index.html` 展示頁升級為可實際使用的 AI 室內改造網站。正式程式採 React、TypeScript、vinext 與 Cloudflare Workers 相容輸出；根目錄的 `index.html` 僅保留作為早期展示版本與歷史參考，不是正式入口。

## 對外入口

- 客戶版：`/`
- 設計師版：`/designer`
- 兩版皆要求使用 ChatGPT 帳號登入。

## 核心流程

1. 上傳 JPG、PNG 或 WEBP 現場圖片。
2. Space Analyzer 分析空間。
3. Design Director 產生設計策略。
4. Render Director 以原圖為基礎生成改造圖。
5. 使用者可輸入累積續改指令；續改會回到原始圖片重新套用，降低結構漂移。

## 品質與成本策略

- 客戶版：GPT Image 2，中等品質，優先控制速度與成本。
- 設計師版：GPT Image 2，高品質，優先保留模型、視角與細節。
- 設計師版支援點與線標記、端點拖曳、整體移動、複製及刪除。

## API

- `/api/analyze-space`
- `/api/create-design`
- `/api/research-style`
- `/api/render`
- `/api/revise`

所有 AI API 均在伺服器端執行並要求登入；`OPENAI_API_KEY` 只能透過託管平台秘密設定，禁止提交到 Git。

## 開發與驗證

```text
npm install
npm run dev
npm test
npm run build
```

`sources/` 是同步參考資料，必須保持唯讀。`.openai/hosting.json` 僅包含 Sites 專案識別資訊，不得放入秘密值。

## GitHub 工作方式

1. GitHub `main` 保持穩定。
2. 從最新 `main` 建立 `agent/*` 或功能分支。
3. 修改前先檢查工作區及遠端差異。
4. 執行密鑰掃描、測試及建置。
5. 使用一般 push 與 Pull Request；禁止 force push。

## 待辦

- 在 Pull Request 確認完整 MVP 與早期靜態展示頁的整合內容。
- 為 `main` 啟用 branch protection。
- 增加 API 模擬測試與瀏覽器互動測試。
- 評估參考圖片搜尋、使用額度與任務紀錄功能。
