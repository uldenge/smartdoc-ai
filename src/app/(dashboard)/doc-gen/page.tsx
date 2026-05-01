import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DocGenList } from "@/components/doc-gen/doc-gen-list";

export default async function DocGenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">文档生成</h1>
        <p className="text-muted-foreground text-sm mt-1">
          选择模板和知识库，AI 将基于知识库内容自动生成专业技术文档
        </p>
      </div>
      <DocGenList />
    </div>
  );
}
