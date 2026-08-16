import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "金鼎 AI 室內改造引擎",
  description: "上傳現場照片，透過 AI 空間分析、設計規劃與高品質渲染完成室內改造提案。",
  openGraph: {
    title: "金鼎 AI 室內改造引擎",
    description: "從現場照片到室內改造提案，支援客戶需求與設計師專業工作流程。",
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
