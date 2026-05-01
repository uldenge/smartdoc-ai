"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { DocTemplate } from "@/types";

interface TemplateUploadProps {
  onUploaded: (template: DocTemplate) => void;
  onCancel: () => void;
}

type UploadStep = "idle" | "uploading" | "preview" | "error";

interface ParsedPreview {
  name: string;
  description: string;
  category: string;
  sections: { id: string; title: string; prompt_hint: string }[];
  variables: { name: string; label: string; required: boolean }[];
}

export function TemplateUpload({ onUploaded, onCancel }: TemplateUploadProps) {
  const [step, setStep] = useState<UploadStep>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [createdTemplate, setCreatedTemplate] = useState<DocTemplate | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".md") && !file.name.toLowerCase().endsWith(".markdown")) {
      toast.error("仅支持 .md 格式的文件");
      return;
    }
    setSelectedFile(file);
    setStep("idle");
    setPreview(null);
    setErrorMessage("");
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  async function handleUpload() {
    if (!selectedFile) return;

    setStep("uploading");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/templates/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json.details
          ? `${json.error}: ${json.details.join("；")}`
          : json.error || "上传失败";
        setErrorMessage(msg);
        setStep("error");
        return;
      }

      // 解析成功 — 显示预览
      const template = json.data;
      setCreatedTemplate(template);
      setPreview({
        name: template.name,
        description: template.description || "",
        category: template.category,
        sections: template.sections || [],
        variables: template.variables || [],
      });
      setStep("preview");
    } catch {
      setErrorMessage("网络错误，上传失败");
      setStep("error");
    }
  }

  async function handleCancel() {
    // 如果模板已创建但用户取消，删除它
    if (createdTemplate) {
      try {
        await fetch(`/api/templates/${createdTemplate.id}`, {
          method: "DELETE",
        });
      } catch {
        // 忽略删除错误
      }
    }
    onCancel();
  }

  function handleConfirm() {
    if (createdTemplate) {
      onUploaded(createdTemplate);
    }
  }

  // 下载示例模板
  function downloadExample() {
    const example = `---
name: 项目立项报告模板
description: 适用于软件项目的立项报告模板
category: technical
variables:
  - name: project_name
    label: 项目名称
    type: text
    required: true
  - name: budget
    label: 项目预算
    type: text
    required: false
---

# {{project_name}} 立项报告

## 项目背景
<!-- prompt: 请介绍 {{project_name}} 的项目背景和发起原因 -->

## 目标与范围
<!-- prompt: 请描述 {{project_name}} 的项目目标和范围定义 -->

## 技术方案
<!-- prompt: 请描述 {{project_name}} 的技术方案选型 -->

## 预算与资源
<!-- prompt: 请描述 {{project_name}} 的预算分配和资源配置，参考预算 {{budget}} -->

## 风险评估
<!-- prompt: 请识别 {{project_name}} 的潜在风险并提出应对措施 -->
`;
    const blob = new Blob([example], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-example.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* 拖拽上传区 */}
      {step === "idle" || step === "error" ? (
        <>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground mb-3"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            <p className="text-sm font-medium">
              拖拽 .md 文件到此处
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              或点击选择文件
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          {/* 已选文件 */}
          {selectedFile && (
            <Card>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
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
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="text-sm">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button size="sm" onClick={handleUpload}>
                  上传并解析
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 错误提示 */}
          {step === "error" && errorMessage && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
              {errorMessage}
            </div>
          )}

          {/* 格式说明 */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">模板格式说明：</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>文件开头用 <code className="bg-muted px-1 rounded">---</code> 包裹 YAML 元信息（name / description / category / variables）</li>
              <li>用 <code className="bg-muted px-1 rounded">## 标题</code> 定义章节</li>
              <li>用 <code className="bg-muted px-1 rounded">&lt;!-- prompt: ... --&gt;</code> 定义每个章节的 AI 提示词</li>
              <li>用 <code className="bg-muted px-1 rounded">{"{{变量名}}"}</code> 定义可替换变量</li>
            </ul>
            <button
              onClick={downloadExample}
              className="text-primary hover:underline mt-1"
            >
              📥 下载示例模板
            </button>
          </div>
        </>
      ) : null}

      {/* 上传中 */}
      {step === "uploading" && (
        <div className="flex flex-col items-center py-8">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">正在解析模板...</p>
        </div>
      )}

      {/* 预览解析结果 */}
      {step === "preview" && preview && (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-lg p-3 text-sm">
            ✅ 模板解析成功
          </div>

          {/* 元信息 */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">模板名称</span>
              <span className="font-medium">{preview.name}</span>
            </div>
            {preview.description && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">描述</span>
                <span className="font-medium">{preview.description}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">分类</span>
              <span className="font-medium">{preview.category}</span>
            </div>
          </div>

          {/* 章节列表 */}
          <div>
            <p className="text-sm font-medium mb-2">
              章节列表 ({preview.sections.length} 个)
            </p>
            <div className="space-y-1.5">
              {preview.sections.map((s, i) => (
                <div
                  key={s.id}
                  className="text-sm bg-muted/50 rounded p-2.5"
                >
                  <span className="text-muted-foreground">{i + 1}.</span>{" "}
                  <span className="font-medium">{s.title}</span>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {s.prompt_hint}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 变量列表 */}
          {preview.variables.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                变量 ({preview.variables.length} 个)
              </p>
              <div className="flex flex-wrap gap-2">
                {preview.variables.map((v) => (
                  <span
                    key={v.name}
                    className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                  >
                    {v.label}
                    {v.required && (
                      <span className="text-destructive ml-0.5">*</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button onClick={handleConfirm}>确认使用此模板</Button>
          </div>
        </div>
      )}
    </div>
  );
}
