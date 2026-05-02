import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EditContent } from "./edit-content";
import type { DocTemplate, TemplateCategory, TemplateSection, TemplateVariable } from "@/types";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("doc_templates")
    .select("id, user_id, name, description, category, is_system, sections, variables, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    redirect("/doc-gen/templates");
  }

  // 系统模板重定向到查看页
  if (data.is_system) {
    redirect(`/doc-gen/templates/${id}/view`);
  }

  // snake_case → camelCase
  const template: DocTemplate = {
    id: data.id,
    userId: data.user_id ?? null,
    name: data.name,
    description: data.description,
    category: (data.category || "general") as TemplateCategory,
    isSystem: data.is_system,
    sections: (data.sections as TemplateSection[]) || [],
    variables: (data.variables as TemplateVariable[]) || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return <EditContent template={template} />;
}
