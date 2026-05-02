"use client";

import { Button } from "@/components/ui/button";
import { SectionItem } from "@/components/template-editor/section-item";
import type { TemplateSection } from "@/types";
import { MAX_SECTIONS } from "@/lib/doc-gen/template-validator";

interface SectionEditorProps {
  sections: TemplateSection[];
  onChange: (sections: TemplateSection[]) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
}

function generateId(sections: TemplateSection[]): string {
  const maxNum = sections.reduce(
    (max, s) => Math.max(max, parseInt(s.id.replace("s", "")) || 0),
    0
  );
  return `s${maxNum + 1}`;
}

export function SectionEditor({ sections, onChange, disabled, errors }: SectionEditorProps) {
  function handleAdd() {
    if (sections.length >= MAX_SECTIONS) return;
    const newSection: TemplateSection = {
      id: generateId(sections),
      title: "",
      description: "",
      prompt_hint: "",
      required: true,
    };
    onChange([...sections, newSection]);
  }

  function handleUpdate(index: number, updated: TemplateSection) {
    const next = [...sections];
    next[index] = updated;
    onChange(next);
  }

  function handleDelete(index: number) {
    onChange(sections.filter((_, i) => i !== index));
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const next = [...sections];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  }

  function handleMoveDown(index: number) {
    if (index === sections.length - 1) return;
    const next = [...sections];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          章节管理
          <span className="text-muted-foreground ml-1">({sections.length}/{MAX_SECTIONS})</span>
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || sections.length >= MAX_SECTIONS}
        >
          + 添加章节
        </Button>
      </div>

      {errors?.sections && (
        <p className="text-xs text-destructive">{errors.sections}</p>
      )}

      <div className="space-y-2">
        {sections.map((section, i) => (
          <SectionItem
            key={section.id}
            section={section}
            index={i}
            total={sections.length}
            onMoveUp={() => handleMoveUp(i)}
            onMoveDown={() => handleMoveDown(i)}
            onDelete={() => handleDelete(i)}
            onUpdate={(updated) => handleUpdate(i, updated)}
            disabled={disabled}
            error={errors?.[`sections[${i}].title`] || errors?.[`sections[${i}].prompt_hint`]}
          />
        ))}
      </div>

      {sections.length === 0 && !errors?.sections && (
        <p className="text-xs text-muted-foreground text-center py-4">
          点击"添加章节"开始定义模板结构
        </p>
      )}
    </div>
  );
}
