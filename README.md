# 金鼎 AI 室內改造引擎

上傳單張現場照片，經 Space Analyzer、Design Director、Render Director 三層流程生成室內改造圖，並支援以結果圖繼續修改。

## 本機執行

需要 Node.js 22.13+ 與 `OPENAI_API_KEY`。

```bash
pnpm install
pnpm dev
```

API：`/api/analyze-space`、`/api/create-design`、`/api/render`、`/api/revise`。

此版本不包含 CAD、SKP、自動尺寸、報價或施工圖。
