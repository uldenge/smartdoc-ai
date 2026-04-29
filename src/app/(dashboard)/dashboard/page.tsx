import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { KnowledgeBaseList } from "@/components/knowledge-base/list";

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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">仪表盘</h1>
        <p className="mt-1 text-muted-foreground">
          欢迎使用 SmartDoc AI，{user.email}
        </p>
      </div>
      <KnowledgeBaseList />
    </div>
  );
}
