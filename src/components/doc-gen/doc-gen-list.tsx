"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { GeneratedDocStatus } from "@/types";

interface GeneratedDocItem {
  id: string;
  title: string;
  status: GeneratedDocStatus;
  templateId: string;
  knowledgeBaseId: string;
  templateName: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<
  GeneratedDocStatus,
  { label: string; color: string; icon: string }
> = {
  draft: { label: "草稿", color: "text-gray-500 bg-gray-100", icon: "📝" },
  generating: { label: "生成中", color: "text-blue-500 bg-blue-100", icon: "⏳" },
  completed: { label: "已完成", color: "text-green-600 bg-green-100", icon: "✅" },
  error: { label: "出错", color: "text-red-500 bg-red-100", icon: "❌" },
};

export function DocGenList() {
  const [docs, setDocs] = useState<GeneratedDocItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    try {
      const res = await fetch("/api/doc-gen");
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
        return;
      }
      setDocs(json.data || []);
    } catch {
      toast.error("加载文档列表失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("确定删除此文档？")) return;

    try {
      const res = await fetch(`/api/doc-gen/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
        return;
      }
      toast.success("删除成功");
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      toast.error("删除失败");
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-lg border bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">📄</div>
        <h3 className="text-lg font-medium mb-2">还没有生成文档</h3>
        <p className="text-muted-foreground text-sm mb-4">
          选择模板和知识库，AI 将基于知识库内容自动生成专业技术文档
        </p>
        <Link href="/doc-gen/new">
          <Button>创建文档</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{docs.length} 篇文档</p>
        <Link href="/doc-gen/new">
          <Button size="sm">新建文档</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((doc) => {
          const statusConfig = STATUS_CONFIG[doc.status];
          return (
            <Link key={doc.id} href={`/doc-gen/${doc.id}`}>
              <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm font-medium line-clamp-2 leading-tight">
                      {doc.title}
                    </CardTitle>
                    <button
                      onClick={(e) => handleDelete(doc.id, e)}
                      className="text-muted-foreground hover:text-destructive shrink-0 ml-2"
                      title="删除"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                  <CardDescription className="text-xs">
                    {doc.templateName}
                  </CardDescription>
                </CardHeader>
                <div className="px-6 pb-4 flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.color}`}
                  >
                    {statusConfig.icon} {statusConfig.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(doc.updatedAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
