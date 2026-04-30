"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

interface Document {
  id: string;
  name: string;
  type: string;
  size_bytes: number;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface DocumentListProps {
  knowledgeBaseId: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "待处理", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  processing: { label: "处理中", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  ready: { label: "已就绪", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  error: { label: "出错", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string): string {
  switch (type) {
    case "pdf":  return "PDF";
    case "docx": return "DOCX";
    case "pptx": return "PPTX";
    case "xlsx": return "XLSX";
    case "epub": return "EPUB";
    case "txt":  return "TXT";
    case "md":   return "MD";
    default:     return type.toUpperCase();
  }
}

export function DocumentList({ knowledgeBaseId }: DocumentListProps) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/documents?knowledgeBaseId=${knowledgeBaseId}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setDocs(data.data || []);
      setError("");
    } catch {
      setError("加载失败");
    } finally {
      setLoading(false);
    }
  }, [knowledgeBaseId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`确定删除文档「${name}」？此操作不可撤销。`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error("删除失败", { description: data.error });
        return;
      }
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success("已删除", { description: `文档「${name}」已删除` });
    } catch {
      toast.error("删除失败", { description: "网络错误，请重试" });
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
        <p className="text-muted-foreground">
          还没有文档，上传 PDF、TXT、MD、DOCX、PPTX、XLSX 或 EPUB 文件开始构建知识库
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {docs.map((doc) => {
        const status = STATUS_MAP[doc.status] || STATUS_MAP.pending;
        return (
          <Card key={doc.id} size="sm">
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                  {getFileIcon(doc.type)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium">{doc.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(doc.size_bytes)}</span>
                    <span>{new Date(doc.created_at).toLocaleDateString("zh-CN")}</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  {doc.status === "error" && doc.error_message && (
                    <p className="mt-1 text-xs text-destructive">
                      {doc.error_message}
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(doc.id, doc.name)}
                disabled={deletingId === doc.id}
              >
                {deletingId === doc.id ? "删除中..." : "删除"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
