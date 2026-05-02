"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { TemplateVariable } from "@/types";

interface VariableItemProps {
  variable: TemplateVariable;
  index: number;
  onDelete: () => void;
  onUpdate: (updated: TemplateVariable) => void;
  disabled?: boolean;
}

export function VariableItem({ variable, index, onDelete, onUpdate, disabled }: VariableItemProps) {
  function handleField(field: keyof TemplateVariable, value: string | boolean | string[]) {
    onUpdate({ ...variable, [field]: value });
  }

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">变量 #{index + 1}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-destructive hover:text-destructive text-xs"
          onClick={() => {
            if (confirm(`确定删除变量"${variable.label || variable.name}"吗？`)) {
              onDelete();
            }
          }}
          disabled={disabled}
        >
          删除
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">变量名</label>
          <Input
            value={variable.name}
            onChange={(e) => handleField("name", e.target.value.replace(/[^\w]/g, ""))}
            placeholder="project_name"
            disabled={disabled}
            maxLength={50}
            className="text-xs font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">显示标签</label>
          <Input
            value={variable.label}
            onChange={(e) => handleField("label", e.target.value)}
            placeholder="项目名称"
            disabled={disabled}
            maxLength={50}
            className="text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">类型</label>
          <select
            value={variable.type}
            onChange={(e) => handleField("type", e.target.value)}
            disabled={disabled}
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="text">文本 (text)</option>
            <option value="textarea">多行文本 (textarea)</option>
            <option value="select">下拉选择 (select)</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">默认值</label>
          <Input
            value={variable.default || ""}
            onChange={(e) => handleField("default", e.target.value)}
            placeholder="(可选)"
            disabled={disabled}
            maxLength={100}
            className="text-xs"
          />
        </div>
      </div>

      {/* select 类型的选项 */}
      {variable.type === "select" && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            选项列表 <span className="text-muted-foreground/60">(用英文逗号分隔)</span>
          </label>
          <Input
            value={variable.options?.join(", ") || ""}
            onChange={(e) => {
              const opts = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
              handleField("options", opts);
            }}
            placeholder="选项1, 选项2, 选项3"
            disabled={disabled}
            className="text-xs"
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <Checkbox
          checked={variable.required}
          onCheckedChange={(checked) => handleField("required", !!checked)}
          disabled={disabled}
        />
        <label className="text-xs text-muted-foreground">必填</label>
      </div>
    </div>
  );
}
