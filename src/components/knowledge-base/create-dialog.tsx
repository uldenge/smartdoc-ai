"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CreateKnowledgeBaseDialogProps {
  onSuccess: () => void;
}

export function CreateKnowledgeBaseDialog({
  onSuccess,
}: CreateKnowledgeBaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("请输入知识库名称");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setName("");
      setDescription("");
      setOpen(false);
      onSuccess();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>新建知识库</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建知识库</DialogTitle>
          <DialogDescription>
            创建一个知识库来管理你的文档
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="kb-name">名称</Label>
              <Input
                id="kb-name"
                placeholder="例如：产品文档"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-desc">描述（可选）</Label>
              <Input
                id="kb-desc"
                placeholder="简单描述这个知识库的用途"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                maxLength={200}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
