import Link from "next/link";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    title: "文档上传",
    desc: "支持 PDF、TXT、Markdown 格式，一键上传自动解析",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
    title: "语义检索",
    desc: "基于向量数据库的语义搜索，精准定位知识片段",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "AI 问答",
    desc: "基于 RAG 技术，AI 基于文档内容精准回答并引用来源",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* 导航栏 */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <svg width="28" height="28" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="url(#hg)" />
              <defs>
                <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <path d="M9 10h14v2H9zm0 4h10v2H9zm0 4h12v2H9z" fill="white" opacity="0.9" />
              <circle cx="23" cy="21" r="5" fill="#fbbf24" />
              <path d="M23 18.5v5m-2.5-2.5h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            SmartDoc AI
          </Link>
          <nav className="flex items-center gap-2">
            <Button render={<Link href="/login" />} variant="ghost" size="sm">
              登录
            </Button>
            <Button render={<Link href="/register" />} size="sm">
              免费注册
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero 区 */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground mb-8">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            基于 RAG 技术的 AI 知识库
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
            让文档变成
            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              可对话的 AI 知识库
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            上传你的文档，SmartDoc AI 会自动解析、分块、向量化。
            用自然语言提问，AI 基于你的文档内容精准回答，并标注来源。
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              render={<Link href="/register" />}
              size="lg"
              className="w-full sm:w-auto px-8 text-base"
            >
              开始使用 — 免费
            </Button>
            <Button
              render={<Link href="/login" />}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-8 text-base"
            >
              已有账号？登录
            </Button>
          </div>
        </section>

        {/* 特性区 */}
        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
            <h2 className="text-center text-2xl font-semibold sm:text-3xl mb-12">
              核心功能
            </h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border bg-card p-6 text-center space-y-4 transition-shadow hover:shadow-md"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-lg">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA 区 */}
        <section className="py-20 text-center">
          <div className="mx-auto max-w-2xl px-4 space-y-6">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              准备好让你的文档变智能了吗？
            </h2>
            <p className="text-muted-foreground">
              注册即可开始，无需信用卡。
            </p>
            <Button render={<Link href="/register" />} size="lg" className="px-8 text-base">
              免费开始使用
            </Button>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="border-t py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>SmartDoc AI — AI 知识库问答系统</p>
          <p>Powered by Next.js + Supabase + RAG</p>
        </div>
      </footer>
    </div>
  );
}
