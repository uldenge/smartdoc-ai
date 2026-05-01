"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TemplateSelector } from "@/components/doc-gen/template-selector";
import { VariableForm } from "@/components/doc-gen/variable-form";
import { toast } from "sonner";
import type { DocTemplate } from "@/types";

interface KnowledgeBase {
  id: string;
  name: string;
  description: string | null;
}

export default function NewDocGenPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKbIds, setSelectedKbIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchKnowledgeBases();
  }, []);

  // 模板选择后自动进入下一步
  useEffect(() => {
    if (selectedTemplate && step === 1) {
      setStep(2);
    }
  }, [selectedTemplate, step]);

  // 自动生成标题
  useEffect(() => {
    if (selectedTemplate && variables.project_name && !title) {
      setTitle(`${variables.project_name} - ${selectedTemplate.name}`);
    }
  }, [selectedTemplate, variables.project_name, title]);

  async function fetchKnowledgeBases() {
    try {
      const res = await fetch("/api/knowledge-base");
      const json = await res.json();
      if (json.data) {
        setKnowledgeBases(json.data);
        if (json.data.length > 0) {
          setSelectedKbIds([json.data[0].id]);
        }
      }
    } catch {
      toast.error("加载知识库列表失败");
    }
  }

  async function handleCreate() {
    if (!selectedTemplate) {
      toast.error("请选择模板");
      return;
    }
    if (selectedKbIds.length === 0) {
      toast.error("请选择至少一个知识库");
      return;
    }
    if (!title.trim()) {
      toast.error("请填写文档标题");
      return;
    }

    // 验证必填变量
    const missingVars = selectedTemplate.variables
      .filter((v) => v.required && !variables[v.name]?.trim())
      .map((v) => v.label);
    if (missingVars.length > 0) {
      toast.error(`请填写: ${missingVars.join("、")}`);
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/doc-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          knowledgeBaseIds: selectedKbIds,
          title: title.trim(),
          variables,
        }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
        return;
      }
      toast.success("文档草稿已创建");
      router.push(`/doc-gen/${json.data.id}`);
    } catch {
      toast.error("创建失败");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* 面包屑 + 标题 */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <button
            onClick={() => router.push("/doc-gen")}
            className="hover:text-foreground"
          >
            文档生成
          </button>
          <span>/</span>
          <span className="text-foreground">新建文档</span>
        </div>
        <h1 className="text-2xl font-bold">创建技术文档</h1>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center gap-4">
        <StepIndicator step={1} current={step} label="选择模板" />
        <div className="flex-1 border-t" />
        <StepIndicator step={2} current={step} label="配置参数" />
        <div className="flex-1 border-t" />
        <StepIndicator step={3} current={step} label="确认创建" />
      </div>

      {/* Step 1: 选择模板 */}
      {step >= 1 && (
        <Card className={step === 1 ? "" : "opacity-60"}>
          <CardHeader className="pb-3 cursor-pointer" onClick={() => setStep(1)}>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs">
                1
              </span>
              选择模板
              {selectedTemplate && (
                <span className="text-sm text-muted-foreground font-normal">
                  — {selectedTemplate.name}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          {step === 1 && (
            <CardContent>
              <TemplateSelector
                selectedId={selectedTemplate?.id || null}
                onSelect={setSelectedTemplate}
              />
            </CardContent>
          )}
        </Card>
      )}

      {/* Step 2: 配置参数 */}
      {step >= 2 && selectedTemplate && (
        <Card className={step === 2 ? "" : "opacity-60"}>
          <CardHeader className="pb-3 cursor-pointer" onClick={() => setStep(2)}>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs">
                2
              </span>
              配置参数
            </CardTitle>
          </CardHeader>
          {step === 2 && (
            <CardContent className="space-y-6">
              {/* 选择知识库 */}
              <div className="space-y-1.5">
                <Label className="text-sm">
                  选择知识库（可多选） <span className="text-destructive">*</span>
                  {selectedKbIds.length > 0 && (
                    <span className="text-muted-foreground font-normal ml-2">
                      已选 {selectedKbIds.length} 个
                    </span>
                  )}
                </Label>
                {knowledgeBases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    暂无知识库，请先创建知识库并上传文档
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {knowledgeBases.map((kb) => {
                      const isSelected = selectedKbIds.includes(kb.id);
                      return (
                        <button
                          key={kb.id}
                          onClick={() => {
                            setSelectedKbIds((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== kb.id)
                                : [...prev, kb.id]
                            );
                          }}
                          className={`text-left p-3 rounded-lg border transition-colors text-sm ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                              : "hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{kb.name}</span>
                            {isSelected && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          {kb.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {kb.description}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 填写标题 */}
              <div className="space-y-1.5">
                <Label htmlFor="doc-title" className="text-sm">
                  文档标题 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="doc-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="请输入文档标题"
                />
              </div>

              {/* 填写模板变量 */}
              {selectedTemplate.variables.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-sm">模板变量</Label>
                  <VariableForm
                    variables={selectedTemplate.variables}
                    values={variables}
                    onChange={setVariables}
                  />
                </div>
              )}

              {/* 模板章节预览 */}
              <div className="space-y-1.5">
                <Label className="text-sm">生成章节预览</Label>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                  {selectedTemplate.sections.map((s, i) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="text-muted-foreground">{i + 1}.</span>
                      <span className="font-medium">{s.title}</span>
                      <span className="text-xs text-muted-foreground">
                        — {s.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  上一步
                </Button>
                <Button onClick={() => setStep(3)}>下一步</Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Step 3: 确认创建 */}
      {step === 3 && selectedTemplate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs">
                3
              </span>
              确认创建
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">模板</span>
                <span className="font-medium">{selectedTemplate.name}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground shrink-0">知识库</span>
                <span className="font-medium text-right">
                  {selectedKbIds.length === 0
                    ? "未选择"
                    : selectedKbIds
                        .map((id) => knowledgeBases.find((kb) => kb.id === id)?.name)
                        .filter(Boolean)
                        .join("、")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">文档标题</span>
                <span className="font-medium">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">章节数</span>
                <span className="font-medium">{selectedTemplate.sections.length} 个</span>
              </div>
              {Object.entries(variables).filter(([, v]) => v).length > 0 && (
                <div className="border-t pt-3">
                  <span className="text-muted-foreground">变量:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {Object.entries(variables)
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <span
                          key={k}
                          className="text-xs px-2 py-1 rounded bg-primary/10 text-primary"
                        >
                          {selectedTemplate.variables.find((tv) => tv.name === k)?.label}: {v}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                上一步
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? "创建中..." : "创建并生成"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StepIndicator({
  step,
  current,
  label,
}: {
  step: number;
  current: number;
  label: string;
}) {
  const isActive = step === current;
  const isDone = step < current;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium ${
          isDone
            ? "bg-green-500 text-white"
            : isActive
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isDone ? "✓" : step}
      </span>
      <span
        className={`text-sm ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}
      >
        {label}
      </span>
    </div>
  );
}
