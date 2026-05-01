"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import type { DocTemplate, TemplateCategory } from "@/types";

interface TemplateSelectorProps {
  selectedId: string | null;
  onSelect: (template: DocTemplate) => void;
}

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

export function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<DocTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/templates");
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
        return;
      }
      setTemplates(json.data || []);
    } catch {
      toast.error("加载模板列表失败");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-lg border bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        暂无可用模板
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((t) => (
        <Card
          key={t.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedId === t.id
              ? "ring-2 ring-primary shadow-md"
              : "hover:border-primary/50"
          }`}
          onClick={() => onSelect(t)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base leading-tight">{t.name}</CardTitle>
              {t.isSystem && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                  系统
                </span>
              )}
            </div>
            <CardDescription className="text-xs line-clamp-2">
              {t.description}
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-4 flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[t.category]}`}
            >
              {CATEGORY_LABELS[t.category]}
            </span>
            <span className="text-xs text-muted-foreground">
              {t.sections.length} 个章节
            </span>
            <span className="text-xs text-muted-foreground">
              {t.variables.length} 个变量
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
