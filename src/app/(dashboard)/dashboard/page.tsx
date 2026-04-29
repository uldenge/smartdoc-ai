import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">仪表盘</h1>
      <p className="mt-2 text-muted-foreground">
        欢迎使用 SmartDoc AI，{user.email}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-medium">知识库</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            管理你的文档和知识库
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-medium">对话</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            基于知识库进行 AI 问答
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-medium">文档上传</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            上传 PDF/TXT 文档构建知识库
          </p>
        </div>
      </div>
    </div>
  );
}
