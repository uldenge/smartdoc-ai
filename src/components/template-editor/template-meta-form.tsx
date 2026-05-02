"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TemplateCategory } from "@/types";

const CATEGORY_OPTIONS: { value: TemplateCategory; label: string }[] = [
  { value: "general", label: "通用" },
  { value: "technical", label: "技术方案" },
  { value: "requirement", label: "需求分析" },
  { value: "design", label: "系统设计" },
];

interface TemplateMetaFormProps {
  name: string;
  description: string;
  category: TemplateCategory;
  onChange: (fields: { name?: string; description?: string; category?: TemplateCategory }) => void;
  disabled?: boolean;
  errors?: { name?: string; description?: string; category?: string };
}

export function TemplateMetaForm({
  name,
  description,
  category,
  onChange,
  disabled,
  errors,
}: TemplateMetaFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">
          模板名称 <span className="text-destructive">*</span>
        </label>
        <Input
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="例如：技术方案模板"
          disabled={disabled}
          maxLength={100}
        />
        {errors?.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">描述</label>
        <Textarea
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="简要描述模板的适用场景"
          disabled={disabled}
          rows={2}
          maxLength={500}
        />
        {errors?.description && <p className="text-xs text-destructive mt-1">{errors.description}</p>}
      </div>

      <div>
        <label className="text-sm font-medium mb-1.5 block">分类</label>
        <select
          value={category}
          onChange={(e) => onChange({ category: e.target.value as TemplateCategory })}
          disabled={disabled}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors?.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
      </div>
    </div>
  );
}
