import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SmartDoc AI — AI 知识库问答系统",
    template: "%s | SmartDoc AI",
  },
  description:
    "上传文档，构建知识库，用自然语言提问获得精准回答。基于 RAG 技术的 AI 知识库问答系统。",
  keywords: [
    "AI 知识库",
    "RAG",
    "文档问答",
    "向量数据库",
    "知识管理",
    "SmartDoc",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
