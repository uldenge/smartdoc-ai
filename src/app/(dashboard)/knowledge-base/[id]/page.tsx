import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DetailContent } from "@/components/knowledge-base/detail-content";

export default async function KnowledgeBaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: kb } = await supabase
    .from("knowledge_bases")
    .select("id, name, description, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!kb) {
    redirect("/dashboard");
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Button render={<Link href="/dashboard" />} variant="ghost" size="sm">
          仪表盘
        </Button>
        <span>/</span>
        <span>{kb.name}</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold">{kb.name}</h1>
        {kb.description && (
          <p className="mt-1 text-muted-foreground">{kb.description}</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          创建于 {new Date(kb.created_at).toLocaleDateString("zh-CN")}
        </p>
      </div>

      <DetailContent knowledgeBaseId={id} />
    </div>
  );
}
