const button = document.querySelector("button");
const file = document.querySelector("input[type='file']");

button?.addEventListener("click", async () => {
  if (!file?.files?.length) return alert("請先選擇圖片或 PDF");
  button.disabled = true;
  button.textContent = "正在建立任務…";
  try {
    const response = await fetch("/api/renders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ originalImageUrl: `local-file://${file.files[0].name}` }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "建立失敗");
    alert("AI 改造任務已送到金鼎控制中心");
  } catch (error) {
    alert(error instanceof Error ? error.message : "建立失敗");
  } finally {
    button.disabled = false;
    button.textContent = "開始 AI 渲染";
  }
});
