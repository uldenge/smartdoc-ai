"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { TemplateSection } from "@/types";

interface SectionItemProps {
  section: TemplateSection;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onUpdate: (updated: TemplateSection) => void;
  disabled?: boolean;
  error?: string;
}

export function SectionItem({
  section,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onDelete,
  onUpdate,
  disabled,
  error,
}: SectionItemProps) {
  const [expanded, setExpanded] = useState(false);

  function handleField(field: keyof TemplateSection, value: string | boolean) {
    onUpdate({ ...section, [field]: value });
  }

  return (
    <div className={`border rounded-lg transition-colors ${error ? "border-destructive" : "border-border"}`}>
      {/* 折叠头部 */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span className="text-sm font-medium text-muted-foreground w-6">
          {index + 1}.
        </span>
        <span className="text-sm font-medium flex-1 truncate">
          {section.title || "(未命名章节)"}
        </span>
        {section.required && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            必填
          </span>
        )}
        {error && (
          <span className="text-xs text-destructive truncate max-w-32">{error}</span>
        )}
      </div>

      {/* 展开内容 */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">章节标题</label>
            <Input
              value={section.title}
              onChange={(e) => handleField("title", e.target.value)}
              placeholder="例如：项目概述"
              disabled={disabled}
              maxLength={100}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">章节描述</label>
            <Input
              value={section.description}
              onChange={(e) => handleField("description", e.target.value)}
              placeholder="简要描述该章节要撰写的内容"
              disabled={disabled}
              maxLength={200}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              AI 生成提示
              <span className="text-muted-foreground/60 ml-1">
                (用 {"{{变量名}}"} 引用变量)
              </span>
            </label>
            <Textarea
              value={section.prompt_hint}
              onChange={(e) => handleField("prompt_hint", e.target.value)}
              placeholder="例如：请介绍 {{project_name}} 的技术架构设计"
              disabled={disabled}
              rows={2}
              maxLength={500}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={section.required}
                onCheckedChange={(checked) => handleField("required", !!checked)}
                disabled={disabled}
              />
              <label className="text-xs text-muted-foreground">必填章节</label>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveUp}
                disabled={disabled || index === 0}
                title="上移"
              >
                ↑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveDown}
                disabled={disabled || index === total - 1}
                title="下移"
              >
                ↓
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm(`确定删除章节"${section.title || "未命名"}"吗？`)) {
                    onDelete();
                  }
                }}
                disabled={disabled}
                title="删除"
              >
                ✕
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
