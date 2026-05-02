"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TemplateUpload } from "@/components/doc-gen/template-upload";
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
  const [showUploadDialog, setShowUploadDialog] = useState(false);

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

  function handleTemplateUploaded(template: DocTemplate) {
    setShowUploadDialog(false);
    fetchTemplates(); // 刷新列表
    onSelect(template); // 自动选中新模板
    toast.success("模板上传成功");
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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => {
          // Supabase 返回 snake_case，需要兼容两种命名
          const id = t.id;
          const name = t.name;
          const description = t.description;
          const isSystem = (t as unknown as { is_system: boolean }).is_system ?? t.isSystem;
          const category = ((t as unknown as { category: string }).category || "general") as TemplateCategory;
          const sections = (t as unknown as { sections: { id: string; title: string }[] }).sections || [];
          const variables = (t as unknown as { variables: { name: string }[] }).variables || [];

          return (
            <Card
              key={id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedId === id
                  ? "ring-2 ring-primary shadow-md"
                  : "hover:border-primary/50"
              }`}
              onClick={() => onSelect(t)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{name}</CardTitle>
                  {isSystem && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                      系统
                    </span>
                  )}
                  {!isSystem && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
                      自定义
                    </span>
                  )}
                </div>
                <CardDescription className="text-xs line-clamp-2">
                  {description}
                </CardDescription>
              </CardHeader>
              <div className="px-6 pb-3 flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[category]}`}
                >
                  {CATEGORY_LABELS[category]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {sections?.length || 0} 章节
                </span>
                <span className="text-xs text-muted-foreground">
                  {variables?.length || 0} 变量
                </span>
              </div>
              {/* 操作按钮 */}
              <div className="px-6 pb-3 flex gap-2">
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(t);
                  }}
                >
                  选择
                </button>
                {isSystem ? (
                  <Link
                    href={`/doc-gen/templates/${id}/view`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    查看
                  </Link>
                ) : (
                  <Link
                    href={`/doc-gen/templates/${id}/edit`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    编辑
                  </Link>
                )}
              </div>
            </Card>
          );
        })}

        {/* 在线创建模板卡片 */}
        <Link href="/doc-gen/templates/new">
          <Card className="cursor-pointer border-2 border-dashed hover:border-primary/50 hover:bg-muted/30 transition-all h-full">
            <CardHeader className="pb-3 flex items-center justify-center min-h-[120px]">
              <div className="text-center text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto mb-2"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
                <p className="text-sm font-medium">在线创建模板</p>
                <p className="text-xs mt-1">可视化编辑章节和变量</p>
              </div>
            </CardHeader>
          </Card>
        </Link>

        {/* 上传自定义模板卡片 */}
        <Card
          className="cursor-pointer border-2 border-dashed hover:border-primary/50 hover:bg-muted/30 transition-all"
          onClick={() => setShowUploadDialog(true)}
        >
          <CardHeader className="pb-3 flex items-center justify-center min-h-[120px]">
            <div className="text-center text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="text-sm font-medium">上传 Markdown 模板</p>
              <p className="text-xs mt-1">上传 .md 文件作为模板</p>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* 上传对话框 */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>上传自定义模板</DialogTitle>
            <DialogDescription>
              上传 Markdown 文件作为模板。使用 ## 标题定义章节，使用
              {" {{变量名}} "}定义变量。
            </DialogDescription>
          </DialogHeader>
          <TemplateUpload
            onUploaded={handleTemplateUploaded}
            onCancel={() => setShowUploadDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
