"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { TemplateMetaForm } from "@/components/template-editor/template-meta-form";
import { SectionEditor } from "@/components/template-editor/section-editor";
import { VariableManager } from "@/components/template-editor/variable-manager";
import { TemplatePreview } from "@/components/template-editor/template-preview";
import { validateTemplate } from "@/lib/doc-gen/template-validator";
import type { DocTemplate, TemplateCategory, TemplateSection, TemplateVariable } from "@/types";

interface TemplateEditorLayoutProps {
  mode: "create" | "edit" | "view";
  template?: DocTemplate;
}

export function TemplateEditorLayout({ mode, template }: TemplateEditorLayoutProps) {
  const router = useRouter();
  const isReadonly = mode === "view";

  // 表单状态
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [category, setCategory] = useState<TemplateCategory>(template?.category ?? "general");
  const [sections, setSections] = useState<TemplateSection[]>(template?.sections ?? []);
  const [variables, setVariables] = useState<TemplateVariable[]>(template?.variables ?? []);

  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dirty tracking
  const markDirty = useCallback(() => {
    if (!isDirty) setIsDirty(true);
  }, [isDirty]);

  // beforeunload 警告
  useEffect(() => {
    if (!isDirty || isReadonly) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, isReadonly]);

  // 保存
  async function handleSave() {
    const validation = validateTemplate({ name, description, category, sections, variables });
    if (!validation.valid) {
      setErrors(validation.errors);
      toast.error("请修正表单中的错误");
      return;
    }

    setErrors({});
    setSaving(true);

    const payload = {
      name: name.trim().slice(0, 100),
      description: description?.trim()?.slice(0, 500) || null,
      category,
      sections: sections.map((s) => ({
        ...s,
        title: s.title.trim(),
        description: s.description.trim(),
        prompt_hint: s.prompt_hint.trim(),
      })),
      variables: variables.map((v) => ({
        ...v,
        name: v.name.trim(),
        label: v.label.trim(),
      })),
    };

    try {
      const url = mode === "create" ? "/api/templates" : `/api/templates/${template!.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.error) {
        toast.error(json.error);
        return;
      }

      toast.success(mode === "create" ? "模板创建成功" : "模板更新成功");
      setIsDirty(false);

      if (mode === "create" && json.data?.id) {
        router.push(`/doc-gen/templates/${json.data.id}/edit`);
      }
    } catch {
      toast.error("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    if (isDirty && !confirm("有未保存的更改，确定要放弃吗？")) return;
    router.back();
  }

  // 面包屑标题
  const breadcrumbTitle = mode === "create" ? "新建模板" : mode === "edit" ? "编辑模板" : "查看模板";

  // 编辑器内容（左右分栏或 Tab 中的编辑面板）
  const editorPanel = (
    <div className="space-y-6">
      {/* 基本信息 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateMetaForm
            name={name}
            description={description}
            category={category}
            onChange={(fields) => {
              if (fields.name !== undefined) setName(fields.name);
              if (fields.description !== undefined) setDescription(fields.description);
              if (fields.category !== undefined) setCategory(fields.category);
              markDirty();
            }}
            disabled={isReadonly}
            errors={errors}
          />
        </CardContent>
      </Card>

      {/* 章节管理 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">章节结构</CardTitle>
        </CardHeader>
        <CardContent>
          <SectionEditor
            sections={sections}
            onChange={(s) => { setSections(s); markDirty(); }}
            disabled={isReadonly}
            errors={errors}
          />
        </CardContent>
      </Card>

      {/* 变量管理 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">模板变量</CardTitle>
        </CardHeader>
        <CardContent>
          <VariableManager
            variables={variables}
            sections={sections}
            onChange={(v) => { setVariables(v); markDirty(); }}
            disabled={isReadonly}
            errors={errors}
          />
        </CardContent>
      </Card>
    </div>
  );

  // 预览面板
  const previewPanel = (
    <Card className="sticky top-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">实时预览</CardTitle>
      </CardHeader>
      <CardContent>
        <TemplatePreview
          name={name}
          description={description}
          category={category}
          sections={sections}
          variables={variables}
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* 面包屑 + 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/doc-gen/templates" className="hover:text-foreground">模板管理</Link>
          <span>/</span>
          <span className="text-foreground">{breadcrumbTitle}</span>
          {isReadonly && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              只读
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {!isReadonly && (
            <>
              <Button variant="outline" size="sm" onClick={handleDiscard} disabled={saving}>
                放弃
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "保存中..." : mode === "create" ? "创建模板" : "保存更改"}
              </Button>
            </>
          )}
          {isReadonly && (
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              返回
            </Button>
          )}
        </div>
      </div>

      {/* 响应式布局：桌面端左右分栏，移动端 Tab */}
      {/* 桌面端 */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        <div>{editorPanel}</div>
        <div>{previewPanel}</div>
      </div>

      {/* 移动端 Tab */}
      <div className="lg:hidden">
        <Tabs defaultValue="edit">
          <TabsList className="w-full">
            <TabsTrigger value="edit" className="flex-1">编辑</TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">预览</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="mt-4">
            {editorPanel}
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            {previewPanel}
          </TabsContent>
        </Tabs>
      </div>

      {/* 底部操作栏（移动端可见） */}
      {!isReadonly && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex gap-2 z-50">
          <Button variant="outline" className="flex-1" onClick={handleDiscard} disabled={saving}>
            放弃
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : mode === "create" ? "创建" : "保存"}
          </Button>
        </div>
      )}
    </div>
  );
}
