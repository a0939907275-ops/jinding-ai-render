# PROJECT_CONTEXT — 金鼎 AI 渲染工作室

> 最後更新：2026-08-16
>
> Repo：`a0939907275-ops/jinding-ai-render`
>
> 狀態：早期公開展示頁；尚未建立實際 AI 渲染後端

## 目前進度

- 已有 `index.html` 單頁展示網站及簡介 README。
- 尚無套件管理、後端服務、自動測試或部署設定。
- 2026-08-16 補齊跨裝置交接、版本、安全與環境範本文件。
- 2026-08-16 新增 GitHub Actions CI，驗證靜態入口、必要文件及常見秘密格式。

## 架構

```text
瀏覽器 → index.html（純靜態 HTML / CSS）
```

目前沒有 API、資料庫或秘密環境變數。

## 重要決策

- GitHub 是程式碼與專案狀態的唯一真相來源。
- 現階段保留零建置工具的靜態架構，直到 AI 渲染需求與服務供應商確定。
- 未來的 AI API key 只能放在伺服器端秘密管理中，禁止寫入瀏覽器程式或 Git。
- `main` 保持可直接預覽；新功能使用短生命週期 branch 與 PR。

## 下一步

1. 確認此 repo 保持公開或改為私人；接入 AI API 前建議重新評估可見性。
2. 定義第一版使用流程：上傳、風格選擇、生成、下載與任務紀錄。
3. 選定 AI 影像服務、後端 runtime、儲存與身分驗證方式。
4. 建立後端後擴充自動測試及部署文件。
5. 為 `main` 啟用 branch protection。

## 部署方式

目前可作為純靜態網站部署，入口為 `index.html`。尚未在 repo 中確認正式託管平台或自動部署流程。

## 驗證狀態

- 2026-08-16：`index.html` 靜態入口與五個必要文件檢查通過；常見 GitHub／OpenAI／AWS token 與私鑰格式掃描無命中。

## GPT / Codex 接手流程

1. `git pull --ff-only`。
2. 閱讀本文件、README、CHANGELOG 與最近 commits。
3. 檢查 GitHub 上是否已有未合併 branch / PR。
4. 從最新 `main` 建立工作 branch。
5. 完成後更新本文件與 CHANGELOG，再 commit、push 並以 PR 合併。

## 待確認事項

- 產品 owner、目標使用者與第一版驗收標準。
- AI 模型／供應商、費用上限及輸入圖片的隱私保存政策。
- 正式網域、託管平台與 repo 可見性。
# 2026-08-16 中央 CRM 串接更新

- 新增 Node.js 伺服器與 `POST /api/renders`。
- 使用者建立改造任務時，會送出 `render.created` 到金鼎 AI 控制中心。
- 密鑰僅由伺服器使用；正式環境需設定 `JINDING_PLATFORM_URL` 與 `JINDING_INTEGRATION_SECRET`。
- 2026-08-16：新增 Vercel Serverless `POST /api/renders` 與 `/health`，支援建立及完成事件同步至中央控制中心。
- 2026-08-16：補齊 created、processing、completed、failed 狀態與案件名稱、空間、原圖、結果圖、提示詞、風格等統一欄位。
- 2026-08-16：正式 Vercel 環境完成共用 Webhook Secret 設定；正式測試任務已成功同步至控制中心並進入待確認。
