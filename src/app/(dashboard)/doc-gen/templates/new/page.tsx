import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TemplateEditorLayout } from "@/components/template-editor/template-editor-layout";

export default async function NewTemplatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <TemplateEditorLayout mode="create" />;
}
