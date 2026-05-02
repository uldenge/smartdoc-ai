"use client";

import { Separator } from "@/components/ui/separator";
import type { TemplateCategory, TemplateSection, TemplateVariable } from "@/types";

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  general: "通用",
  technical: "技术方案",
  requirement: "需求分析",
  design: "系统设计",
};

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  general: "bg-gray-100 text-gray-700",
  technical: "bg-blue-100 text-blue-700",
  requirement: "bg-green-100 text-green-700",
  design: "bg-purple-100 text-purple-700",
};

interface TemplatePreviewProps {
  name: string;
  description: string;
  category: TemplateCategory;
  sections: TemplateSection[];
  variables: TemplateVariable[];
}

function highlightVariables(text: string): React.ReactNode {
  const parts = text.split(/(\{\{\w+\}\})/g);
  return parts.map((part, i) =>
    /\{\{\w+\}\}/.test(part) ? (
      <code key={i} className="bg-primary/10 text-primary px-1 rounded text-xs font-mono">
        {part}
      </code>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function TemplatePreview({
  name,
  description,
  category,
  sections,
  variables,
}: TemplatePreviewProps) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="text-lg font-bold">{name || "(模板名称)"}</h3>
        {description && <p className="text-muted-foreground text-xs mt-1">{description}</p>}
        <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-2 ${CATEGORY_COLORS[category]}`}>
          {CATEGORY_LABELS[category]}
        </span>
      </div>

      <Separator />

      {/* 章节预览 */}
      <div>
        <h4 className="font-medium text-sm mb-2">章节 ({sections.length})</h4>
        {sections.length === 0 ? (
          <p className="text-xs text-muted-foreground">暂无章节</p>
        ) : (
          <div className="space-y-2">
            {sections.map((s, i) => (
              <div key={s.id} className="border rounded-md p-2.5 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{i + 1}.</span>
                  <span className="text-xs font-medium">{s.title || "(未命名)"}</span>
                  {s.required && <span className="text-xs text-primary">*</span>}
                </div>
                {s.description && (
                  <p className="text-xs text-muted-foreground pl-4">{s.description}</p>
                )}
                {s.prompt_hint && (
                  <div className="text-xs text-muted-foreground/80 pl-4 font-mono bg-muted/50 rounded p-1.5">
                    {highlightVariables(s.prompt_hint)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* 变量预览 */}
      <div>
        <h4 className="font-medium text-sm mb-2">变量 ({variables.length})</h4>
        {variables.length === 0 ? (
          <p className="text-xs text-muted-foreground">暂无变量</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {variables.map((v) => (
              <span
                key={v.name}
                className="text-xs border rounded-md px-2 py-1 inline-flex items-center gap-1"
              >
                <code className="font-mono text-primary">{v.label || v.name}</code>
                <span className="text-muted-foreground">({v.type})</span>
                {v.required && <span className="text-destructive">*</span>}
                {v.default && (
                  <span className="text-muted-foreground">={v.default}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
