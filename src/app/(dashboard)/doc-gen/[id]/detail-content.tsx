"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GenerationViewer } from "@/components/doc-gen/generation-viewer";
import { toast } from "sonner";
import type { SectionContent, TemplateSection, TemplateVariable } from "@/types";

interface DocData {
  id: string;
  title: string;
  status: "draft" | "generating" | "completed" | "error";
  templateId: string;
  knowledgeBaseIds: string[];
  variables: Record<string, string>;
  sectionsContent: SectionContent[];
  fullContent: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TemplateData {
  id: string;
  name: string;
  sections: TemplateSection[];
  variables: TemplateVariable[];
}

interface DocGenDetailContentProps {
  doc: DocData;
  template: TemplateData;
}

export function DocGenDetailContent({ doc, template }: DocGenDetailContentProps) {
  const router = useRouter();
  const [status, setStatus] = useState(doc.status);
  const [fullContent, setFullContent] = useState<string | null>(doc.fullContent);
  const [errorMessage, setErrorMessage] = useState<string | null>(doc.errorMessage);
  const [sections, setSections] = useState<SectionContent[]>(doc.sectionsContent || []);
  const [showFullDoc, setShowFullDoc] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleExport(format: string) {
    try {
      const res = await fetch(`/api/doc-gen/${doc.id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format }),
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "导出失败");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.title.replace(/[^\w一-鿿]/g, "_")}.${format === "markdown" ? "md" : format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("导出成功");
    } catch {
      toast.error("导出失败");
    }
  }

  async function handleSaveEdits() {
    setSaving(true);
    try {
      const res = await fetch(`/api/doc-gen/${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_content: fullContent }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
        return;
      }
      toast.success("保存成功");
      setShowFullDoc(false);
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => router.push("/doc-gen")}
          className="hover:text-foreground"
        >
          文档生成
        </button>
        <span>/</span>
        <span className="text-foreground">{doc.title}</span>
      </div>

      {/* 文档标题 + 操作 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{doc.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span>模板: {template.name}</span>
            <span>·</span>
            <span>{template.sections.length} 个章节</span>
            <span>·</span>
            <StatusBadge status={status} />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {status === "completed" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFullContent(fullContent || "");
                  setShowFullDoc(true);
                }}
              >
                编辑全文
              </Button>
              <Button size="sm" onClick={() => handleExport("markdown")}>
                导出 Markdown
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/doc-gen")}
          >
            返回列表
          </Button>
        </div>
      </div>

      <Separator />

      {/* 编辑模式 */}
      {showFullDoc && fullContent !== null && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">编辑完整文档</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              className="w-full h-96 rounded-md border p-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
              value={fullContent || ""}
              onChange={(e) => setFullContent(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullDoc(false)}
              >
                取消
              </Button>
              <Button size="sm" onClick={handleSaveEdits} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 生成器 / 预览 */}
      {!showFullDoc && (
        <GenerationViewer
          docId={doc.id}
          sections={sections}
          totalSections={template.sections.length}
          fullContent={fullContent}
          status={status}
          errorMessage={errorMessage}
          onComplete={(content) => {
            setFullContent(content);
            setStatus("completed");
          }}
          onError={(msg) => {
            setErrorMessage(msg);
            setStatus("error");
          }}
        />
      )}

      {/* 完成后的全文预览 */}
      {status === "completed" && fullContent && !showFullDoc && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">完整文档预览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {fullContent}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 模板变量信息 */}
      {doc.variables && Object.keys(doc.variables).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">模板变量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(doc.variables).map(([key, value]) => {
                const varDef = template.variables.find((v) => v.name === key);
                return (
                  <span
                    key={key}
                    className="text-xs px-3 py-1.5 rounded-full bg-muted"
                  >
                    {varDef?.label || key}: <strong>{value}</strong>
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; color: string }> = {
    draft: { label: "草稿", color: "text-gray-500 bg-gray-100" },
    generating: { label: "生成中", color: "text-blue-500 bg-blue-100" },
    completed: { label: "已完成", color: "text-green-600 bg-green-100" },
    error: { label: "出错", color: "text-red-500 bg-red-100" },
  };
  const config = configs[status] || configs.draft;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
}
