import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TemplateEditorLayout } from "@/components/template-editor/template-editor-layout";
import type { DocTemplate, TemplateCategory, TemplateSection, TemplateVariable } from "@/types";

export default async function ViewTemplatePage({
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
    .select("id, name, description, category, is_system, sections, variables, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    redirect("/doc-gen/templates");
  }

  // snake_case → camelCase
  const template: DocTemplate = {
    id: data.id,
    userId: null,
    name: data.name,
    description: data.description,
    category: (data.category || "general") as TemplateCategory,
    isSystem: data.is_system,
    sections: (data.sections as TemplateSection[]) || [],
    variables: (data.variables as TemplateVariable[]) || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return <TemplateEditorLayout mode="view" template={template} />;
}
