"use client";

import { TemplateEditorLayout } from "@/components/template-editor/template-editor-layout";
import type { DocTemplate } from "@/types";

interface EditContentProps {
  template: DocTemplate;
}

export function EditContent({ template }: EditContentProps) {
  return <TemplateEditorLayout mode="edit" template={template} />;
}
