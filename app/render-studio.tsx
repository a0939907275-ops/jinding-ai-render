"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */

import {ChangeEvent, DragEvent, useEffect, useMemo, useState} from "react";
import FontSizeControl from "./font-size-control";
import ImageAnnotator, {ImageNote, RenderMode} from "./designer/image-annotator";
import AutoLayoutPlanner from "./auto-layout-planner";
import {layoutPlanForPrompt, type LayoutPlan} from "../lib/layout-planning";

const styles = ["日式", "奶茶奢華", "現代極簡", "北歐", "侘寂", "自訂"];
type Mode = "general" | "professional";
type Phase = "brief" | "working" | "result";
type Version = {id: number; image: string; label: string; createdAt: string};

export default function RenderStudio({initialMode = "general"}: {initialMode?: Mode}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState("");
  const [style, setStyle] = useState("奶茶奢華");
  const [customStyle, setCustomStyle] = useState("");
  const [styleResearch, setStyleResearch] = useState("");
  const [colorScheme, setColorScheme] = useState("暖白與奶茶色");
  const [basicLighting, setBasicLighting] = useState("明亮自然光");
  const [keep, setKeep] = useState("");
  const [remove, setRemove] = useState("");
  const [add, setAdd] = useState("");
  const [other, setOther] = useState("");
  const [imageNotes, setImageNotes] = useState<ImageNote[]>([]);
  const [renderMode, setRenderMode] = useState<RenderMode>("strict");
  const [structureLock, setStructureLock] = useState(true);
  const [cabinetLock, setCabinetLock] = useState(false);
  const [wallLock, setWallLock] = useState(true);
  const [openingsLock, setOpeningsLock] = useState(true);
  const [cameraLock, setCameraLock] = useState(true);
  const [materialZones, setMaterialZones] = useState("");
  const [colorTemperature, setColorTemperature] = useState("3000K 暖白光");
  const [lightDirection, setLightDirection] = useState("依原圖採光方向");
  const [lightIntensity, setLightIntensity] = useState("中等");
  const [furnitureReplacement, setFurnitureReplacement] = useState("");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [seed, setSeed] = useState("");
  const [variation, setVariation] = useState("1");
  const [hdOutput, setHdOutput] = useState(true);
  const [layoutPlan, setLayoutPlan] = useState<LayoutPlan | null>(null);
  const [selectedLayoutId, setSelectedLayoutId] = useState<""|"A"|"B"|"C">("");
  const [phase, setPhase] = useState<Phase>("brief");
  const [step, setStep] = useState(0);
  const [analysis, setAnalysis] = useState("");
  const [design, setDesign] = useState("");
  const [result, setResult] = useState("");
  const [revision, setRevision] = useState("");
  const [revisionHistory, setRevisionHistory] = useState<string[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [compareBase, setCompareBase] = useState("");
  const [error, setError] = useState("");
  const [completedAt, setCompletedAt] = useState("");
  const [comparePosition, setComparePosition] = useState(50);
  const [compareMode, setCompareMode] = useState<"slider" | "side">("slider");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => () => { if (referencePreview) URL.revokeObjectURL(referencePreview); }, [referencePreview]);
  const annotations = useMemo(() => noteSummary(imageNotes), [imageNotes]);
  const resolvedStyle = style === "自訂" ? `${customStyle}\n\nGPT 搜尋整理的視覺參考：\n${styleResearch}` : style;

  function accept(next?: File) {
    if (!next) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(next.type)) return setError("僅支援 JPG、PNG 或 WEBP 圖片");
    if (next.size > 15 * 1024 * 1024) return setError("圖片需小於 15 MB");
    if (preview) URL.revokeObjectURL(preview);
    setFile(next); setPreview(URL.createObjectURL(next)); setImageNotes([]); setLayoutPlan(null); setSelectedLayoutId(""); setError(""); setPhase("brief"); setResult(""); setVersions([]);
  }

  function acceptReference(next?: File) {
    if (!next) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(next.type)) return setError("參考圖僅支援 JPG、PNG 或 WEBP");
    if (referencePreview) URL.revokeObjectURL(referencePreview);
    setReferenceFile(next); setReferencePreview(URL.createObjectURL(next)); setError("");
  }

  async function postForm(endpoint: string, fields: Record<string, string>, image: File | Blob) {
    const body = new FormData();
    body.append("image", await normalizeImage(image), "room.png");
    if (referenceFile && mode === "professional") body.append("reference_image", await normalizeImage(referenceFile), "reference.png");
    Object.entries(fields).forEach(([key, value]) => body.append(key, value));
    const response = await fetch(endpoint, {method: "POST", body});
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "AI 處理失敗");
    return json;
  }

  function sharedFields(): Record<string, string> {
    return {
      style: resolvedStyle, keep, remove, add, other, colorScheme, basicLighting,
      audience: mode === "general" ? "customer" : "professional",
      renderMode: mode === "professional" ? renderMode : "redesign",
      modelLock: String(mode === "professional" && renderMode !== "redesign"),
      annotations: mode === "professional" ? annotations : "無",
      structureLock: "true", cabinetLock: String(mode === "professional" && cabinetLock), wallLock: "true",
      openingsLock: "true", cameraLock: "true", materialZones,
      colorTemperature, lightDirection, lightIntensity, furnitureReplacement, prompt, negativePrompt,
      seed, variation, hdOutput: String(mode === "professional" && hdOutput), referenceImage: referenceFile ? "已提供第二張參考圖，只能作為材質與風格參考" : "無",
      layoutPlan: layoutPlan && selectedLayoutId ? layoutPlanForPrompt(layoutPlan, selectedLayoutId) : "尚未套用 AI 自動配置方案",
    };
  }

  async function generate() {
    if (!file) return setError("請先上傳一張現場照片");
    if (style === "自訂" && !customStyle.trim()) return setError("請描述你想要的自訂風格");
    setPhase("working"); setError("");
    try {
      if (style === "自訂" && !styleResearch) {
        setStep(0);
        const response = await fetch("/api/research-style", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({style: customStyle})});
        const data = await response.json(); if (!response.ok) throw new Error(data.error || "風格參考搜尋失敗"); setStyleResearch(data.research);
      }
      setStep(1);
      const a = await postForm("/api/analyze-space", {annotations, modelLock: sharedFields().modelLock}, file); setAnalysis(a.analysis);
      setStep(2);
      const response = await fetch("/api/create-design", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({...sharedFields(), analysis: a.analysis})});
      const planned = await response.json(); if (!response.ok) throw new Error(planned.error || "設計規劃失敗"); setDesign(planned.design);
      setStep(3);
      const rendered = await postForm("/api/render", {...sharedFields(), design: planned.design}, file);
      const now = new Date().toLocaleString("zh-TW"); setResult(rendered.image); setCompareBase(preview); setCompletedAt(now); setVersions([{id: Date.now(), image: rendered.image, label: "初始版本", createdAt: now}]); setPhase("result");
    } catch (e) { setError(e instanceof Error ? e.message : "發生錯誤"); setPhase("brief"); }
  }

  async function revise() {
    if (!revision.trim() || !result) return;
    setPhase("working"); setStep(4); setError("");
    try {
      const nextHistory = [...revisionHistory, revision.trim()];
      const currentResult = await fetch(result).then(response => response.blob());
      const rendered = await postForm("/api/revise", {...sharedFields(), revision: revision.trim(), revisionHistory: nextHistory.join("\n"), design}, currentResult);
      const now = new Date().toLocaleString("zh-TW");
      setVersions(items => [...items, {id: Date.now(), image: rendered.image, label: `續改 ${items.length}`, createdAt: now}]);
      setCompareBase(result); setResult(rendered.image); setCompletedAt(now); setRevisionHistory(nextHistory); setRevision(""); setPhase("result");
    } catch (e) { setError(e instanceof Error ? e.message : "續改失敗"); setPhase("result"); }
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview); if (referencePreview) URL.revokeObjectURL(referencePreview);
    setFile(null); setPreview(""); setReferenceFile(null); setReferencePreview(""); setResult(""); setAnalysis(""); setDesign(""); setRevision(""); setRevisionHistory([]); setVersions([]); setImageNotes([]); setLayoutPlan(null); setSelectedLayoutId(""); setError(""); setPhase("brief");
  }

  function downloadResult() { if (result) { const link = document.createElement("a"); link.href = result; link.download = `金鼎AI空間渲染-${Date.now()}.webp`; link.click(); } }

  return <main><FontSizeControl />
    <header className="topbar"><div className="brand"><span>金</span><div><b>金鼎 AI 室內渲染系統</b><small>JINDING AI DESIGN STUDIO</small></div></div><ModeSwitch mode={mode} onChange={setMode}/></header>
    <section className="hero"><p>AI INTERIOR RENDERING</p><h1>同一個專案，精準控制每一次修改。</h1><span>{mode === "general" ? "快速設定風格、色系與燈光，完成空間渲染。" : "鎖定結構與視角，只修改指定區域，延續每一版成果。"}</span></section>

    {phase === "result" ? <section className="result-wrap">
      <div className="result-head"><div><p>DESIGN RESULT · {mode === "general" ? "一般模式" : "專業模式"}</p><h2>空間渲染提案</h2><small>{completedAt} 完成 · 共 {versions.length} 個版本</small></div><div className="result-actions"><button className="subtle" onClick={() => setPhase("brief")}>調整需求</button><button className="download" onClick={downloadResult}>下載{mode === "professional" && hdOutput ? "高清" : ""}圖 ↓</button></div></div>
      <ModeSwitch mode={mode} onChange={setMode}/>
      <div className="compare-tools"><span>比較方式</span><button className={compareMode === "slider" ? "active" : ""} onClick={() => setCompareMode("slider")}>滑桿比較</button><button className={compareMode === "side" ? "active" : ""} onClick={() => setCompareMode("side")}>並排比較</button></div>
      {compareMode === "slider" ? <div className="compare-slider"><img src={compareBase || preview} alt="比較基準"/><div className="after-layer" style={{clipPath: `inset(0 ${100 - comparePosition}% 0 0)`}}><img src={result} alt="AI 渲染結果"/></div><div className="compare-line" style={{left: `${comparePosition}%`}}><i>↔</i></div><span className="before-tag">BASE</span><span className="after-tag">CURRENT</span><input aria-label="調整版本比較比例" type="range" min="5" max="95" value={comparePosition} onChange={e => setComparePosition(Number(e.target.value))}/></div> : <div className="compare"><figure><img src={compareBase || preview} alt="比較基準"/><figcaption>BASE · 比較基準</figcaption></figure><figure><img src={result} alt="目前版本"/><figcaption>CURRENT · 目前版本</figcaption></figure></div>}
      <section className="version-history"><div><b>歷史版本</b><span>選擇版本作為比較基準，或切回繼續修改</span></div><div className="version-list">{versions.map(version => <article key={version.id} className={version.image === result ? "active" : ""}><img src={version.image} alt={version.label}/><b>{version.label}</b><small>{version.createdAt}</small><div><button onClick={() => setCompareBase(version.image)}>設為基準</button><button onClick={() => setResult(version.image)}>切換此版</button></div></article>)}</div></section>
      <div className="revision"><div><b>還想調整哪裡？</b><span>{mode === "professional" ? "續改以上一版為基礎，鎖定未指定區域與空間結構" : "輸入簡單需求，延續目前版本繼續修改"}</span></div><div className="revision-input"><input value={revision} onChange={e => setRevision(e.target.value)} onKeyDown={e => e.key === "Enter" && revise()} placeholder="輸入後續修改需求…"/><button disabled={!revision.trim()} onClick={revise}>繼續修改 <b>→</b></button></div></div>
      <details><summary>查看 AI 空間分析與設計規劃</summary><div className="insights"><article><b>空間分析</b><p>{analysis}</p></article><article><b>設計規劃</b><p>{design}</p></article></div></details>
    </section> : <section className="studio">
      <div className="progress"><span className="active">01 <b>上傳現場</b></span><i className={file ? "done" : ""}/><span className={file ? "active" : ""}>02 <b>設定需求</b></span><i/><span>03 <b>AI 渲染</b></span></div>
      <div className="workspace"><section className="upload-side"><div className="section-title"><span>01</span><div><p>YOUR SPACE</p><h2>上傳現場照片</h2></div></div>
        <label className={`dropzone ${preview ? "has-image" : ""}`} onDragOver={(e: DragEvent) => e.preventDefault()} onDrop={(e: DragEvent) => {e.preventDefault(); accept(e.dataTransfer.files[0]);}}>{preview ? <><img src={preview} alt="現場照片預覽"/><div className="image-meta"><b>✓ 照片已就緒</b><span>{file?.name} · {file ? (file.size / 1024 / 1024).toFixed(1) : 0} MB</span></div><div className="change">更換照片</div></> : <div><strong>＋</strong><b>拖曳照片到這裡</b><span>或點擊選擇檔案</span><small>JPG、PNG、WEBP · 最大 15 MB</small></div>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e: ChangeEvent<HTMLInputElement>) => accept(e.target.files?.[0])}/></label>
        <div className="photo-tip"><b>拍攝建議</b><span>保持鏡頭水平、空間完整入鏡，光線越充足，AI 越能準確理解現場。</span></div>
      </section><section className="brief-side"><div className="section-title"><span>02</span><div><p>{mode === "general" ? "QUICK BRIEF" : "PRO CONTROL"}</p><h2>{mode === "general" ? "快速設定渲染需求" : "精準控制渲染範圍"}</h2></div></div>
        <ModeSwitch mode={mode} onChange={setMode}/>
        <div className="field-label">選擇設計風格</div><div className="style-grid">{styles.map(item => <button key={item} className={style === item ? "selected" : ""} onClick={() => setStyle(item)}><i>{item === "日式" ? "和" : item === "奶茶奢華" ? "奢" : item === "現代極簡" ? "簡" : item === "北歐" ? "北" : item === "侘寂" ? "寂" : "＋"}</i><span>{item}</span></button>)}</div>
        {style === "自訂" && <div className="custom-style-search"><input className="custom" value={customStyle} onChange={e => {setCustomStyle(e.target.value); setStyleResearch("");}} placeholder="直接輸入想要的風格"/><small>生成時由 GPT 整理材質、配色、家具與配置參考。</small></div>}
        <div className="quick-controls"><label>色系<input value={colorScheme} onChange={e => setColorScheme(e.target.value)} placeholder="暖白、奶茶、深木色…"/></label><label>基本燈光<select value={basicLighting} onChange={e => setBasicLighting(e.target.value)}><option>明亮自然光</option><option>溫暖情境光</option><option>中性均勻光</option><option>夜間氛圍光</option></select></label></div>
        {mode === "general" ? <label className="simple-request">簡單修改需求<textarea value={other} onChange={e => setOther(e.target.value)} placeholder="例如：增加收納、換成淺色沙發、整體更明亮…"/></label> : <><AutoLayoutPlanner file={file} analysis={analysis} annotations={annotations} plan={layoutPlan} selectedId={selectedLayoutId} onPlan={plan=>{setLayoutPlan(plan);setSelectedLayoutId("")}} onApply={setSelectedLayoutId}/><ProfessionalControls preview={preview} imageNotes={imageNotes} setImageNotes={setImageNotes} renderMode={renderMode} setRenderMode={setRenderMode} values={{keep,remove,add,other,materialZones,colorTemperature,lightDirection,lightIntensity,furnitureReplacement,prompt,negativePrompt,seed,variation}} setters={{setKeep,setRemove,setAdd,setOther,setMaterialZones,setColorTemperature,setLightDirection,setLightIntensity,setFurnitureReplacement,setPrompt,setNegativePrompt,setSeed,setVariation}} locks={{structureLock,cabinetLock,wallLock,openingsLock,cameraLock}} lockSetters={{setStructureLock,setCabinetLock,setWallLock,setOpeningsLock,setCameraLock}} referencePreview={referencePreview} acceptReference={acceptReference} hdOutput={hdOutput} setHdOutput={setHdOutput}/></>}
        {error && <p className="error">{error}</p>}<button className="generate" disabled={!file} onClick={generate}><span>✦</span> 開始 AI 空間渲染 <b>→</b></button>{file && <button className="reset" onClick={reset}>清除專案，重新開始</button>}<small className="promise">鎖定建築格局，不鎖室內設計；家具與材質會依風格重新規劃</small>
      </section></div>
    </section>}
    {phase === "working" && <div className="overlay"><div className="loader"><span>金</span><div className="rings"/></div><p>JINDING AI RENDERING</p><h2>{step === 0 ? "正在整理風格參考…" : step === 1 ? "正在理解空間結構…" : step === 2 ? "正在規劃設計方案…" : step === 3 ? "正在生成空間渲染…" : "正在延續上一版修改…"}</h2><div className="step-dots">{[1,2,3].map(n => <i key={n} className={step >= n ? "on" : ""}/>)}</div><small>請保持此頁開啟</small></div>}
    <footer>© 2026 金鼎室內設計 · AI 輔助概念提案，實際施工仍需專業現場評估</footer>
  </main>;
}

function ModeSwitch({mode, onChange}: {mode: Mode; onChange: (mode: Mode) => void}) {
  return <div className="mode-switch" aria-label="操作模式"><button className={mode === "general" ? "active" : ""} onClick={() => onChange("general")}>一般模式</button><button className={mode === "professional" ? "active" : ""} onClick={() => onChange("professional")}>專業模式</button></div>;
}

type Setter = (value: string) => void;
function ProfessionalControls(props: any) {
  const {preview,imageNotes,setImageNotes,renderMode,setRenderMode,values,setters,locks,lockSetters,referencePreview,acceptReference,hdOutput,setHdOutput}=props;
  return <div className="professional-controls">
    {preview && <ImageAnnotator image={preview} notes={imageNotes} onChange={setImageNotes} mode={renderMode} onModeChange={setRenderMode}/>} 
    <fieldset><legend>建築鎖定（不鎖室內設計）</legend><div className="lock-grid">{[["建築格局",locks.structureLock,lockSetters.setStructureLock],["櫃體比例（選用）",locks.cabinetLock,lockSetters.setCabinetLock],["牆面",locks.wallLock,lockSetters.setWallLock],["門窗比例",locks.openingsLock,lockSetters.setOpeningsLock],["Camera Lock",locks.cameraLock,lockSetters.setCameraLock]].map(([label,checked,setter]: any) => <label key={label}><input type="checkbox" checked={checked} onChange={e => setter(e.target.checked)}/>{label}</label>)}</div></fieldset>
    <div className="requirements"><TextField label="保留" value={values.keep} set={setters.setKeep}/><TextField label="移除" value={values.remove} set={setters.setRemove}/><TextField label="新增" value={values.add} set={setters.setAdd}/><TextField label="其他" value={values.other} set={setters.setOther}/></div>
    <div className="advanced-grid"><TextField label="材質分區控制" value={values.materialZones} set={setters.setMaterialZones}/><TextField label="家具替換" value={values.furnitureReplacement} set={setters.setFurnitureReplacement}/><label>燈光色溫<input value={values.colorTemperature} onChange={e => setters.setColorTemperature(e.target.value)}/></label><label>方向<input value={values.lightDirection} onChange={e => setters.setLightDirection(e.target.value)}/></label><label>強度<select value={values.lightIntensity} onChange={e => setters.setLightIntensity(e.target.value)}><option>低</option><option>中等</option><option>高</option></select></label><label>Seed / Variation<input value={`${values.seed}${values.seed ? " / " : ""}${values.variation}`} onChange={e => {const [seed,variation] = e.target.value.split("/"); setters.setSeed(seed.trim()); setters.setVariation((variation || "1").trim());}} placeholder="例如 42 / 1"/></label></div>
    <TextField label="Prompt" value={values.prompt} set={setters.setPrompt}/><TextField label="Negative Prompt" value={values.negativePrompt} set={setters.setNegativePrompt}/>
    <label className="reference-upload">Reference Image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => acceptReference(e.target.files?.[0])}/>{referencePreview ? <img src={referencePreview} alt="參考圖"/> : <span>＋ 上傳材質／風格參考圖</span>}</label>
    <label className="hd-toggle"><input type="checkbox" checked={hdOutput} onChange={e => setHdOutput(e.target.checked)}/> 高清輸出</label>
  </div>;
}

function TextField({label,value,set}:{label:string;value:string;set:Setter}) { return <label><span><b>{label}</b></span><textarea aria-label={label} value={value} onChange={e => set(e.target.value)} placeholder={`輸入${label}要求…`}/></label>; }

async function normalizeImage(image: File | Blob): Promise<Blob> { try { const bitmap=await createImageBitmap(image),maxSide=2048,scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement("canvas"); canvas.width=Math.max(1,Math.round(bitmap.width*scale)); canvas.height=Math.max(1,Math.round(bitmap.height*scale)); const context=canvas.getContext("2d"); if(!context)return image; context.drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close(); return await new Promise(resolve=>canvas.toBlob(blob=>resolve(blob||image),"image/png")); } catch { return image; } }
function noteSummary(notes: ImageNote[]) { return notes.length ? notes.map((note,index)=>note.x2!==undefined?`${index+1}. 線段 (${note.x}%, ${note.y}%) 到 (${note.x2}%, ${note.y2}%)：${note.text}`:`${index+1}. 單點 (${note.x}%, ${note.y}%)：${note.text}`).join("\n") : "無定位備註"; }
