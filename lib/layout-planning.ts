export type LayoutFurniture = {
  furnitureType: string;
  position: string;
  wall: string;
  orientation: string;
  approximateWidth: number;
  approximateDepth: number;
  locked: boolean;
  notes: string;
};

export type LayoutScheme = {
  id: "A" | "B" | "C";
  name: string;
  strategy: string;
  furniture: LayoutFurniture[];
  reasoning: string;
  pros: string[];
  cons: string[];
  scores: { circulation: number; storage: number; spaciousness: number };
};

export type LayoutPlan = {
  spaceType: string;
  spatialAnalysis: {
    architecture: string[];
    circulation: string[];
    usableWalls: string[];
    configurableZones: string[];
    uncertainty: string[];
  };
  schemes: LayoutScheme[];
};

export const LAYOUT_PLANNER = `你是金鼎室內設計的 Layout Planning Director。你的工作只負責空間使用與家具／櫃體配置，不負責風格、材質、配色或圖片渲染。

絕對鎖定原圖的牆、門、窗、柱、梁、建築開口、房間比例、相機視角、透視與構圖。不得重新改格局，不得假設看不見的精確尺寸。先辨識主要動線、可用牆面、可配置區域、開門與櫃門範圍，再配置家具。

最低尺寸只作為評分條件，不是所有案件的硬性規則：主要走道盡量 80cm 以上、次要走道 60cm 以上、沙發與茶几約 35–50cm、餐椅後方約 75cm 以上、床側走道約 60cm 以上。必須考慮人體工學、出入口、開門、抽屜、觀看距離、拉椅空間、窗戶採光與動線衝突。無法從單張圖片確認的尺寸，必須列入 uncertainty，不可假裝精確。

固定產生三案：A 最佳動線、B 最大收納、C 視覺效果優先。三案都要實際可用且遵守鎖定家具、指定牆面與單件重新配置要求。`;

export const layoutPlanSchema = {
  type: "object",
  additionalProperties: false,
  required: ["spaceType", "spatialAnalysis", "schemes"],
  properties: {
    spaceType: {type: "string"},
    spatialAnalysis: {
      type: "object", additionalProperties: false,
      required: ["architecture", "circulation", "usableWalls", "configurableZones", "uncertainty"],
      properties: {
        architecture: {type: "array", items: {type: "string"}},
        circulation: {type: "array", items: {type: "string"}},
        usableWalls: {type: "array", items: {type: "string"}},
        configurableZones: {type: "array", items: {type: "string"}},
        uncertainty: {type: "array", items: {type: "string"}},
      },
    },
    schemes: {
      type: "array", minItems: 3, maxItems: 3,
      items: {
        type: "object", additionalProperties: false,
        required: ["id", "name", "strategy", "furniture", "reasoning", "pros", "cons", "scores"],
        properties: {
          id: {type: "string", enum: ["A", "B", "C"]}, name: {type: "string"}, strategy: {type: "string"},
          furniture: {type: "array", items: {type: "object", additionalProperties: false, required: ["furnitureType", "position", "wall", "orientation", "approximateWidth", "approximateDepth", "locked", "notes"], properties: {
            furnitureType: {type: "string"}, position: {type: "string"}, wall: {type: "string"}, orientation: {type: "string"}, approximateWidth: {type: "number"}, approximateDepth: {type: "number"}, locked: {type: "boolean"}, notes: {type: "string"},
          }}},
          reasoning: {type: "string"}, pros: {type: "array", items: {type: "string"}}, cons: {type: "array", items: {type: "string"}},
          scores: {type: "object", additionalProperties: false, required: ["circulation", "storage", "spaciousness"], properties: {circulation: {type: "number", minimum: 0, maximum: 100}, storage: {type: "number", minimum: 0, maximum: 100}, spaciousness: {type: "number", minimum: 0, maximum: 100}}},
        },
      },
    },
  },
} as const;

export function validateLayoutPlan(value: unknown): LayoutPlan {
  if (!value || typeof value !== "object") throw new Error("AI 配置資料格式錯誤");
  const plan = value as LayoutPlan;
  if (!Array.isArray(plan.schemes) || plan.schemes.length !== 3) throw new Error("AI 必須回傳 A/B/C 三個配置方案");
  if (plan.schemes.map(item => item.id).join("") !== "ABC") throw new Error("配置方案順序必須是 A/B/C");
  return plan;
}

export function layoutPlanForPrompt(plan: LayoutPlan, selectedId: string) {
  const selected = plan.schemes.find(item => item.id === selectedId);
  if (!selected) return "尚未選擇配置方案";
  return JSON.stringify({spaceType: plan.spaceType, spatialAnalysis: plan.spatialAnalysis, selectedScheme: selected});
}
