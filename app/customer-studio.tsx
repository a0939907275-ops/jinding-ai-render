"use client";

import { ChangeEvent, DragEvent, useEffect, useState } from "react";

const styles = ["日式", "奶茶奢華", "現代極簡", "北歐", "侘寂", "自訂"];
type Phase = "brief" | "working" | "result";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [style, setStyle] = useState("奶茶奢華");
  const [customStyle, setCustomStyle] = useState("");
  const [styleResearch, setStyleResearch] = useState("");
  const [keep, setKeep] = useState("");
  const [remove, setRemove] = useState("");
  const [add, setAdd] = useState("");
  const [other, setOther] = useState("");
  const [phase, setPhase] = useState<Phase>("brief");
  const [step, setStep] = useState(0);
  const [analysis, setAnalysis] = useState("");
  const [design, setDesign] = useState("");
  const [result, setResult] = useState("");
  const [revision, setRevision] = useState("");
  const [error, setError] = useState("");
  const [completedAt, setCompletedAt] = useState("");
  const [comparePosition, setComparePosition] = useState(50);
  const [compareMode, setCompareMode] = useState<"slider" | "side">("slider");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function accept(next: File | undefined) {
    if (!next) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(next.type)) return setError("僅支援 JPG、PNG 或 WEBP 圖片");
    if (next.size > 15 * 1024 * 1024) return setError("圖片需小於 15 MB");
    if (preview) URL.revokeObjectURL(preview);
    setFile(next); setPreview(URL.createObjectURL(next)); setError(""); setPhase("brief"); setResult("");
  }

  async function postForm(endpoint: string, fields: Record<string, string>, image: File | Blob) {
    const body = new FormData();
    const normalized = await normalizeImage(image);
    body.append("image", normalized, "room.png");
    Object.entries(fields).forEach(([key, value]) => body.append(key, value));
    const response = await fetch(endpoint, { method: "POST", body });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "AI 處理失敗");
    return json;
  }

  async function generate() {
    if (!file) return setError("請先上傳一張現場照片");
    if (style === "自訂" && !customStyle.trim()) return setError("請描述你想要的自訂風格");
    setPhase("working"); setError("");
    try {
      let resolvedStyle = style;
      if (style === "自訂") {
        setStep(0);
        const response = await fetch("/api/research-style", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ style: customStyle }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "風格參考搜尋失敗");
        setStyleResearch(data.research);
        resolvedStyle = `${customStyle}\n\nGPT 搜尋整理的視覺參考：\n${data.research}`;
      }
      setStep(1);
      const a = await postForm("/api/analyze-space", {}, file);
      setAnalysis(a.analysis);
      setStep(2);
      const d = await fetch("/api/create-design", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ analysis: a.analysis, style: resolvedStyle, keep, remove, add, other }) });
      const dj = await d.json(); if (!d.ok) throw new Error(dj.error || "設計規劃失敗");
      setDesign(dj.design);
      setStep(3);
      const r = await postForm("/api/render", { design: dj.design, style: resolvedStyle, keep, remove, add, other }, file);
      setResult(r.image); setCompletedAt(new Date().toLocaleString("zh-TW")); setPhase("result");
    } catch (e) { setError(e instanceof Error ? e.message : "發生錯誤"); setPhase("brief"); }
  }

  async function revise() {
    if (!revision.trim() || !result) return;
    setPhase("working"); setStep(4); setError("");
    try {
      const blob = await (await fetch(result)).blob();
      const r = await postForm("/api/revise", { revision, design }, blob);
      setResult(r.image); setRevision(""); setPhase("result");
    } catch (e) { setError(e instanceof Error ? e.message : "續改失敗"); setPhase("result"); }
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(""); setResult(""); setAnalysis(""); setDesign(""); setRevision(""); setError(""); setPhase("brief");
  }

  function downloadResult() {
    if (!result) return;
    const link = document.createElement("a"); link.href = result; link.download = `金鼎AI空間改造-${Date.now()}.webp`; link.click();
  }

  return <main>
    <header className="topbar"><div className="brand"><span>金</span><div><b>金鼎 AI 室內改造引擎</b><small>JINDING AI DESIGN STUDIO</small></div></div><div className="status"><i /> AI 設計系統已就緒</div></header>
    <section className="hero"><p>AI INTERIOR TRANSFORMATION</p><h1>把現場，變成你想住的樣子。</h1><span>上傳一張照片，保留建築結構與拍攝視角，重新規劃家具、材質、燈光與氛圍。</span></section>

    {phase === "result" ? <section className="result-wrap">
      <div className="result-head"><div><p>DESIGN RESULT</p><h2>你的空間改造提案</h2><small>{completedAt} 完成</small></div><div className="result-actions"><button className="subtle" onClick={() => setPhase("brief")}>調整需求</button><button className="download" onClick={downloadResult}>下載改造圖 ↓</button></div></div>
      <div className="compare-tools"><span>比較方式</span><button className={compareMode === "slider" ? "active" : ""} onClick={() => setCompareMode("slider")}>滑桿比較</button><button className={compareMode === "side" ? "active" : ""} onClick={() => setCompareMode("side")}>並排比較</button></div>
      {compareMode === "slider" ? <div className="compare-slider">
        <img src={preview} alt="原始空間"/><div className="after-layer" style={{ clipPath: `inset(0 ${100 - comparePosition}% 0 0)` }}><img src={result} alt="AI 改造結果"/></div>
        <div className="compare-line" style={{ left: `${comparePosition}%` }}><i>↔</i></div><span className="before-tag">BEFORE</span><span className="after-tag">AFTER</span>
        <input aria-label="調整原圖與改造圖比較比例" type="range" min="5" max="95" value={comparePosition} onChange={e => setComparePosition(Number(e.target.value))}/>
      </div> : <div className="compare"><figure><img src={preview} alt="原始空間"/><figcaption>BEFORE · 原始現場</figcaption></figure><figure><img src={result} alt="AI 改造結果"/><figcaption>AFTER · AI 改造提案</figcaption></figure></div>}
      <div className="revision"><div><b>還想調整哪裡？</b><span>只修改你指定的內容，其餘設計與空間結構保持不變</span><div className="quick-revisions">{["整體再明亮一點", "材質更有質感", "增加實用收納"].map(text => <button key={text} onClick={() => setRevision(text)}>{text}</button>)}</div></div><div className="revision-input"><input value={revision} onChange={e => setRevision(e.target.value)} onKeyDown={e => e.key === 'Enter' && revise()} placeholder="輸入後續修改需求…"/><button disabled={!revision.trim()} onClick={revise}>繼續修改 <b>→</b></button></div></div>
      <details><summary>查看 AI 空間分析與設計規劃</summary><div className="insights"><article><b>空間分析</b><p>{analysis}</p></article><article><b>設計規劃</b><p>{design}</p></article></div></details>
    </section> : <section className="studio">
      <div className="progress"><span className="active">01 <b>上傳現場</b></span><i className={file ? "done" : ""}/><span className={file ? "active" : ""}>02 <b>設定需求</b></span><i/><span>03 <b>AI 改造</b></span></div>
      <div className="workspace">
        <section className="upload-side"><div className="section-title"><span>01</span><div><p>YOUR SPACE</p><h2>上傳現場照片</h2></div></div>
          <label className={`dropzone ${preview ? "has-image" : ""}`} onDragOver={(e: DragEvent) => e.preventDefault()} onDrop={(e: DragEvent) => { e.preventDefault(); accept(e.dataTransfer.files[0]); }}>
            {preview ? <><img src={preview} alt="現場照片預覽"/><div className="image-meta"><b>✓ 照片已就緒</b><span>{file?.name} · {file ? (file.size / 1024 / 1024).toFixed(1) : 0} MB</span></div><div className="change">更換照片</div></> : <div><strong>＋</strong><b>拖曳照片到這裡</b><span>或點擊選擇檔案</span><small>JPG、PNG、WEBP · 最大 15 MB</small></div>}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e: ChangeEvent<HTMLInputElement>) => accept(e.target.files?.[0])}/>
          </label>
          <div className="photo-tip"><b>拍攝建議</b><span>保持鏡頭水平、空間完整入鏡，光線越充足，AI 越能準確理解現場。</span></div>
        </section>
        <section className="brief-side"><div className="section-title"><span>02</span><div><p>DESIGN BRIEF</p><h2>告訴我們你的想法</h2></div></div>
          <div className="field-label">選擇設計風格</div><div className="style-grid">{styles.map(s => <button key={s} className={style === s ? "selected" : ""} onClick={() => setStyle(s)}><i>{s === "日式" ? "和" : s === "奶茶奢華" ? "奢" : s === "現代極簡" ? "簡" : s === "北歐" ? "北" : s === "侘寂" ? "寂" : "＋"}</i><span>{s}</span></button>)}</div>
          {style === "自訂" && <div className="custom-style-search"><input className="custom" value={customStyle} onChange={e => { setCustomStyle(e.target.value); setStyleResearch(""); }} placeholder="例如：歐美精品飯店、法式奶油復古、自然洞穴風"/><small>生成時會先由 GPT 搜尋合適案例，整理材質、配色、家具與配置參考。</small>{styleResearch && <p>✓ 已完成風格參考研究，將套用於本次 AI 生成</p>}</div>}
          <div className="requirements"><label><span><b>保留</b> 不希望被改動的項目</span><textarea value={keep} onChange={e => setKeep(e.target.value)} placeholder="例：保留原有木地板、窗戶與電視牆"/></label><label><span><b>移除</b> 希望從空間移除</span><textarea value={remove} onChange={e => setRemove(e.target.value)} placeholder="例：移除舊沙發、雜物與吊扇"/></label><label><span><b>新增</b> 想放進空間的內容</span><textarea value={add} onChange={e => setAdd(e.target.value)} placeholder="例：L 型沙發、落地燈、收納櫃"/></label><label><span><b>其他</b> 補充生活需求</span><textarea value={other} onChange={e => setOther(e.target.value)} placeholder="例：家中有寵物，希望好清潔且耐抓"/></label></div>
          {error && <p className="error">{error}</p>}<button className="generate" disabled={!file} onClick={generate}><span>✦</span> 開始 AI 空間改造 <b>→</b></button>{file && <button className="reset" onClick={reset}>清除照片與需求，重新開始</button>}<small className="promise">AI 將保留原始建築結構與拍攝視角，家具配置可重新設計</small>
        </section>
      </div>
    </section>}

    {phase === "working" && <div className="overlay"><div className="loader"><span>金</span><div className="rings"/></div><p>JINDING AI DESIGNING</p><h2>{step === 0 ? "GPT 正在搜尋最合適的風格參考…" : step === 1 ? "正在理解空間結構…" : step === 2 ? "正在規劃設計方案…" : step === 3 ? "正在生成高品質改造圖…" : "正在套用你的修改…"}</h2><div className="step-dots">{[1,2,3].map(n => <i key={n} className={step >= n ? "on" : ""}/>)}</div><small>請稍候，精緻設計需要一點時間</small></div>}
    <footer>© 2026 金鼎室內設計 · AI 輔助概念提案，實際施工仍需專業現場評估</footer>
  </main>;
}

async function normalizeImage(image: File | Blob): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(image);
    const maxSide = 2048;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return image;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob || image), "image/png"));
  } catch {
    return image;
  }
}
