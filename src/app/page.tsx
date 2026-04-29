import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          SmartDoc AI
        </h1>
        <p className="text-lg text-muted-foreground max-w-[600px]">
          上传文档，构建知识库，用自然语言提问获得精准回答。
          基于 RAG 技术的 AI 知识库问答系统。
        </p>
      </div>
      <div className="flex gap-4">
        <Button render={<Link href="/login" />} size="lg">
          登录
        </Button>
        <Button render={<Link href="/register" />} variant="outline" size="lg">
          注册
        </Button>
      </div>
    </div>
  );
}
