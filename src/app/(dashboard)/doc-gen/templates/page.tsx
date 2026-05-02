"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { DocTemplate, TemplateCategory } from "@/types";

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

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<DocTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  async function handleDelete(id: string, name: string) {
    if (!confirm(`确定要删除模板"${name}"吗？此操作不可撤销。`)) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
        return;
      }
      toast.success("模板已删除");
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      toast.error("删除失败");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/doc-gen" className="hover:text-foreground">文档生成</Link>
            <span>/</span>
            <span>模板管理</span>
          </div>
          <h1 className="text-2xl font-bold">模板管理</h1>
          <p className="text-muted-foreground text-sm mt-1">
            管理文档模板，创建或编辑自定义模板
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            返回
          </Button>
          <Link href="/doc-gen/templates/new">
            <Button size="sm">+ 新建模板</Button>
          </Link>
        </div>
      </div>

      {/* 加载骨架屏 */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-lg border bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* 模板卡片网格 */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => {
            const isSystem = (t as unknown as { is_system: boolean }).is_system ?? t.isSystem;
            const category = ((t as unknown as { category: string }).category || "general") as TemplateCategory;
            const sections = (t as unknown as { sections: unknown[] }).sections || [];
            const variables = (t as unknown as { variables: unknown[] }).variables || [];

            return (
              <Card key={t.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{t.name}</CardTitle>
                    {isSystem ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                        系统
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
                        自定义
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-xs line-clamp-2">
                    {t.description}
                  </CardDescription>
                </CardHeader>
                <div className="px-6 pb-3 flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[category]}`}>
                    {CATEGORY_LABELS[category]}
                  </span>
                  <span className="text-xs text-muted-foreground">{sections.length} 章节</span>
                  <span className="text-xs text-muted-foreground">{variables.length} 变量</span>
                </div>
                <div className="px-6 pb-4 mt-auto flex gap-2">
                  {isSystem ? (
                    <Link href={`/doc-gen/templates/${t.id}/view`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">查看</Button>
                    </Link>
                  ) : (
                    <>
                      <Link href={`/doc-gen/templates/${t.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">编辑</Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={deleting === t.id}
                        onClick={() => handleDelete(t.id, t.name)}
                      >
                        {deleting === t.id ? "删除中..." : "删除"}
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 空状态 */}
      {!loading && templates.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">暂无模板</p>
          <p className="text-sm mb-4">点击上方"新建模板"创建你的第一个模板</p>
        </div>
      )}
    </div>
  );
}
