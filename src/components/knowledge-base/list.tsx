"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateKnowledgeBaseDialog } from "./create-dialog";

interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function KnowledgeBaseList() {
  const [items, setItems] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/knowledge-base");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        toast.error("加载知识库失败", { description: data.error });
        return;
      }
      setItems(data.data || []);
      setError("");
    } catch {
      setError("网络连接失败，请检查网络后重试");
      toast.error("网络错误", { description: "无法连接服务器，请检查网络" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`确定删除知识库「${name}」？此操作不可撤销。`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/knowledge-base/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error("删除失败", { description: data.error });
        return;
      }
      setItems((prev) => prev.filter((kb) => kb.id !== id));
      toast.success("已删除", { description: `知识库「${name}」已删除` });
    } catch {
      toast.error("删除失败", { description: "网络错误，请重试" });
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        加载中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">我的知识库</h2>
        <CreateKnowledgeBaseDialog onSuccess={fetchList} />
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground">
            还没有知识库，点击上方「新建知识库」开始
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((kb) => (
            <Card key={kb.id} className="relative group">
              <CardHeader>
                <CardTitle className="text-base">{kb.name}</CardTitle>
                {kb.description && (
                  <CardDescription className="line-clamp-2">
                    {kb.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  创建于{" "}
                  {new Date(kb.created_at).toLocaleDateString("zh-CN")}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    render={<Link href={`/knowledge-base/${kb.id}`} />}
                    size="sm"
                  >
                    查看
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(kb.id, kb.name)}
                    disabled={deletingId === kb.id}
                  >
                    {deletingId === kb.id ? "删除中..." : "删除"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
