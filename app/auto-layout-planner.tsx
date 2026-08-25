"use client";

import {useMemo, useState} from "react";
import type {LayoutPlan, LayoutScheme} from "../lib/layout-planning";

const spaceTypes = ["客廳","餐廳","客餐廳","主臥","次臥","書房","更衣室","玄關","廚房","其他"];
const needsBySpace: Record<string,string[]> = {
  客廳:["三人沙發","電視牆","茶几","收納櫃","展示櫃","書桌","鋼琴","投影","音響","掃地機器人位置"],
  餐廳:["餐桌","餐椅","餐邊櫃","展示櫃","備餐區"], 客餐廳:["沙發","電視牆","茶几","餐桌","餐椅","餐邊櫃","收納櫃"],
  主臥:["雙人床","衣櫃","化妝台","書桌","電視","床頭櫃"], 次臥:["單人床","衣櫃","書桌","床頭櫃"],
  書房:["書桌","書櫃","工作椅","臥榻","收納櫃"], 更衣室:["衣櫃","抽屜櫃","全身鏡","穿衣椅"],
  玄關:["鞋櫃","穿鞋椅","全身鏡","鑰匙平台","掃地機器人位置"], 廚房:["冰箱","高櫃","備餐檯","電器櫃","餐桌"], 其他:["依空間判斷"],
};

export default function AutoLayoutPlanner({file,analysis,annotations,plan,selectedId,onPlan,onApply}:{file:File|null;analysis:string;annotations:string;plan:LayoutPlan|null;selectedId:string;onPlan:(plan:LayoutPlan)=>void;onApply:(id:"A"|"B"|"C")=>void}) {
  const [open,setOpen]=useState(false),[spaceType,setSpaceType]=useState("客廳"),[selectedNeeds,setSelectedNeeds]=useState<string[]>(["三人沙發","電視牆","茶几","收納櫃"]),[customNeeds,setCustomNeeds]=useState(""),[lockedItems,setLockedItems]=useState(""),[designatedWalls,setDesignatedWalls]=useState(""),[singleItem,setSingleItem]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const availableNeeds=useMemo(()=>needsBySpace[spaceType]||needsBySpace.其他,[spaceType]);
  function changeSpace(next:string){setSpaceType(next);setSelectedNeeds((needsBySpace[next]||[]).slice(0,4));}
  function toggleNeed(need:string){setSelectedNeeds(items=>items.includes(need)?items.filter(item=>item!==need):[...items,need]);}
  async function generate(){if(!file)return setError("請先上傳空間圖片");setBusy(true);setError("");try{const body=new FormData();body.append("image",file);body.append("spaceType",spaceType);body.append("requirements",[...selectedNeeds,customNeeds].filter(Boolean).join("、"));body.append("lockedItems",lockedItems);body.append("designatedWalls",designatedWalls);body.append("singleItem",singleItem);body.append("analysis",analysis);body.append("annotations",annotations);const response=await fetch("/api/plan-layout",{method:"POST",body}),json=await response.json();if(!response.ok)throw new Error(json.error||"AI 配置失敗");onPlan(json.plan);setOpen(true)}catch(e){setError(e instanceof Error?e.message:"AI 配置失敗")}finally{setBusy(false)}}
  return <section className="auto-layout-tool"><button type="button" className="auto-layout-trigger" onClick={()=>setOpen(value=>!value)}><span>✦</span><div><b>AI 自動配置</b><small>先規劃家具與櫃體，再交給 Render Engine</small></div><i>{open?"收合":"開啟"}</i></button>{open&&<div className="auto-layout-body">
    <div className="planner-step"><b>1 · AI 分析空間與配置需求</b><span>鎖建築格局，只重新規劃室內配置</span></div>
    <label>空間類型<select value={spaceType} onChange={e=>changeSpace(e.target.value)}>{spaceTypes.map(item=><option key={item}>{item}</option>)}</select></label>
    <div className="planner-label">配置需求</div><div className="need-chips">{availableNeeds.map(need=><button type="button" key={need} className={selectedNeeds.includes(need)?"selected":""} onClick={()=>toggleNeed(need)}>{need}</button>)}</div>
    <label>其他需求<textarea value={customNeeds} onChange={e=>setCustomNeeds(e.target.value)} placeholder="例如：需要六人座、保留更多親子活動空間…"/></label>
    <details className="planner-advanced"><summary>進階限制：鎖定家具／指定牆面／單件配置</summary><label>鎖定家具<input value={lockedItems} onChange={e=>setLockedItems(e.target.value)} placeholder="例如：保留沙發、餐桌與電視位置"/></label><label>指定牆面<input value={designatedWalls} onChange={e=>setDesignatedWalls(e.target.value)} placeholder="例如：照片右側牆面一定做電視牆"/></label><label>只重新配置單件<input value={singleItem} onChange={e=>setSingleItem(e.target.value)} placeholder="例如：只重新找沙發位置；留空則配置全空間"/></label></details>
    {error&&<p className="error">{error}</p>}<button type="button" className="planner-generate" disabled={!file||busy} onClick={generate}>{busy?"正在分析與產生 A/B/C 方案…":"產生三個配置方案"}</button>
    {plan&&<div className="layout-results"><div className="planner-step"><b>2 · 比較並套用配置方案</b><span>評分是配置建議，不代表精確施工尺寸</span></div><div className="layout-schemes">{plan.schemes.map(scheme=><SchemeCard key={scheme.id} scheme={scheme} active={selectedId===scheme.id} onApply={()=>onApply(scheme.id)}/>)}</div>{plan.spatialAnalysis.uncertainty.length>0&&<div className="layout-uncertainty"><b>需現場確認</b><span>{plan.spatialAnalysis.uncertainty.join("；")}</span></div>}</div>}
  </div>}</section>;
}

function SchemeCard({scheme,active,onApply}:{scheme:LayoutScheme;active:boolean;onApply:()=>void}) {return <article className={active?"layout-scheme active":"layout-scheme"}><header><i>{scheme.id}</i><div><b>{scheme.name}</b><small>{scheme.strategy}</small></div></header><p>{scheme.reasoning}</p><ul>{scheme.furniture.slice(0,6).map((item,index)=><li key={`${item.furnitureType}-${index}`}><b>{item.furnitureType}</b><span>{item.position} · {item.wall}</span></li>)}</ul><div className="score-grid"><span>動線<b>{Math.round(scheme.scores.circulation)}</b></span><span>收納<b>{Math.round(scheme.scores.storage)}</b></span><span>空間感<b>{Math.round(scheme.scores.spaciousness)}</b></span></div><details><summary>查看優缺點</summary><p>優點：{scheme.pros.join("、")}</p><p>缺點：{scheme.cons.join("、")}</p></details><button type="button" onClick={onApply}>{active?"✓ 已套用此方案":`套用方案 ${scheme.id}`}</button></article>}
