import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DocGenDetailContent } from "./detail-content";
import type { SectionContent, TemplateSection, TemplateVariable } from "@/types";

export default async function DocGenDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 获取文档详情
  const { data: doc } = await supabase
    .from("generated_documents")
    .select("id, title, status, template_id, knowledge_base_id, variables, sections_content, full_content, error_message, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!doc) redirect("/doc-gen");

  // 获取模板信息
  const { data: template } = await supabase
    .from("doc_templates")
    .select("id, name, sections, variables")
    .eq("id", doc.template_id)
    .single();

  if (!template) redirect("/doc-gen");

  // 转换 snake_case → camelCase 供前端组件使用
  const docData = {
    id: doc.id,
    title: doc.title,
    status: doc.status as "draft" | "generating" | "completed" | "error",
    templateId: doc.template_id,
    knowledgeBaseId: doc.knowledge_base_id,
    variables: doc.variables as Record<string, string>,
    sectionsContent: (doc.sections_content || []) as SectionContent[],
    fullContent: doc.full_content,
    errorMessage: doc.error_message,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  };

  return (
    <DocGenDetailContent
      doc={docData}
      template={{
        id: template.id,
        name: template.name,
        sections: template.sections as TemplateSection[],
        variables: template.variables as TemplateVariable[],
      }}
    />
  );
}
