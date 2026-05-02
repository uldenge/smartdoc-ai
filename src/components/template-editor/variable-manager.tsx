"use client";

import { Button } from "@/components/ui/button";
import { VariableItem } from "@/components/template-editor/variable-item";
import type { TemplateSection, TemplateVariable } from "@/types";
import { MAX_VARIABLES } from "@/lib/doc-gen/template-validator";

interface VariableManagerProps {
  variables: TemplateVariable[];
  sections: TemplateSection[];
  onChange: (variables: TemplateVariable[]) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
}

function detectUndeclaredVars(
  sections: TemplateSection[],
  variables: TemplateVariable[]
): string[] {
  const declared = new Set(variables.map((v) => v.name));
  const found = new Set<string>();
  const pattern = /\{\{(\w+)\}\}/g;

  for (const s of sections) {
    let match: RegExpExecArray | null;
    const tempPattern = new RegExp(pattern.source, pattern.flags);
    while ((match = tempPattern.exec(s.prompt_hint)) !== null) {
      if (!declared.has(match[1])) {
        found.add(match[1]);
      }
    }
  }

  return Array.from(found);
}

export function VariableManager({
  variables,
  sections,
  onChange,
  disabled,
  errors,
}: VariableManagerProps) {
  const undeclared = detectUndeclaredVars(sections, variables);

  function handleAdd() {
    if (variables.length >= MAX_VARIABLES) return;
    const newVar: TemplateVariable = {
      name: "",
      label: "",
      type: "text",
      required: false,
    };
    onChange([...variables, newVar]);
  }

  function handleAddUndeclared(varName: string) {
    if (variables.length >= MAX_VARIABLES) return;
    const newVar: TemplateVariable = {
      name: varName,
      label: varName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      type: "text",
      required: false,
    };
    onChange([...variables, newVar]);
  }

  function handleUpdate(index: number, updated: TemplateVariable) {
    const next = [...variables];
    next[index] = updated;
    onChange(next);
  }

  function handleDelete(index: number) {
    onChange(variables.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          变量管理
          <span className="text-muted-foreground ml-1">({variables.length}/{MAX_VARIABLES})</span>
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || variables.length >= MAX_VARIABLES}
        >
          + 添加变量
        </Button>
      </div>

      {errors?.variables && (
        <p className="text-xs text-destructive">{errors.variables}</p>
      )}

      {/* 未声明变量提示 */}
      {undeclared.length > 0 && (
        <div className="border border-yellow-200 bg-yellow-50 rounded-md p-2.5 space-y-1.5">
          <p className="text-xs text-yellow-800 font-medium">
            在章节 Prompt 中发现未声明的变量：
          </p>
          <div className="flex flex-wrap gap-1.5">
            {undeclared.map((v) => (
              <button
                key={v}
                onClick={() => handleAddUndeclared(v)}
                disabled={disabled}
                className="text-xs px-2 py-0.5 rounded-full border border-yellow-300 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors disabled:opacity-50"
              >
                + {"{{"}
                {v}
                {"}}"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 变量列表 */}
      <div className="space-y-2">
        {variables.map((variable, i) => (
          <VariableItem
            key={i}
            variable={variable}
            index={i}
            onDelete={() => handleDelete(i)}
            onUpdate={(updated) => handleUpdate(i, updated)}
            disabled={disabled}
          />
        ))}
      </div>

      {variables.length === 0 && !errors?.variables && (
        <p className="text-xs text-muted-foreground text-center py-4">
          点击"添加变量"定义模板参数，或在章节 Prompt 中使用 {"{{变量名}}"} 自动检测
        </p>
      )}
    </div>
  );
}
