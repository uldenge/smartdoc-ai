"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TemplateVariable } from "@/types";

interface VariableFormProps {
  variables: TemplateVariable[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export function VariableForm({ variables, values, onChange }: VariableFormProps) {
  if (variables.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        此模板无需填写变量
      </div>
    );
  }

  function handleChange(name: string, value: string) {
    onChange({ ...values, [name]: value });
  }

  return (
    <div className="space-y-4">
      {variables.map((v) => (
        <div key={v.name} className="space-y-1.5">
          <Label htmlFor={`var-${v.name}`} className="text-sm">
            {v.label}
            {v.required && <span className="text-destructive ml-1">*</span>}
            {v.default && (
              <span className="text-muted-foreground ml-2 text-xs">
                (默认: {v.default})
              </span>
            )}
          </Label>
          {v.type === "textarea" ? (
            <Textarea
              id={`var-${v.name}`}
              value={values[v.name] || ""}
              onChange={(e) => handleChange(v.name, e.target.value)}
              placeholder={`请输入${v.label}`}
              rows={3}
            />
          ) : v.type === "select" && v.options ? (
            <select
              id={`var-${v.name}`}
              value={values[v.name] || ""}
              onChange={(e) => handleChange(v.name, e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">请选择</option>
              {v.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id={`var-${v.name}`}
              type="text"
              value={values[v.name] || ""}
              onChange={(e) => handleChange(v.name, e.target.value)}
              placeholder={`请输入${v.label}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
