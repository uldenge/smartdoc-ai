import type { TemplateVariable, SectionContent } from "@/types";

/**
 * 替换模板字符串中的变量占位符
 * {{variable_name}} → 实际值
 */
export function resolveVariables(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match;
  });
}

/**
 * 验证用户填入的变量是否满足必填要求
 */
export function validateVariableInputs(
  templateVariables: TemplateVariable[],
  userInputs: Record<string, string>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const tv of templateVariables) {
    if (tv.required) {
      const value = userInputs[tv.name]?.trim();
      if (!value) {
        errors.push(`"${tv.label}" 为必填项`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 将各章节内容组装为完整的 Markdown 文档
 */
export function assembleFullDocument(
  sections: SectionContent[],
  variables: Record<string, string>
): string {
  const lines: string[] = [];

  // 文档标题
  const projectName = variables.project_name || "项目";
  lines.push(`# ${projectName}`);
  lines.push("");

  // 目录（可选）
  if (sections.length > 3) {
    lines.push("## 目录");
    lines.push("");
    sections.forEach((s, i) => {
      if (s.content.trim()) {
        lines.push(`${i + 1}. [${s.title}](#${s.title.toLowerCase().replace(/\s+/g, "-")})`);
      }
    });
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  // 各章节内容
  for (const section of sections) {
    if (section.content.trim()) {
      lines.push(section.content);
      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  return lines.join("\n");
}

/**
 * 为未填入的变量设置默认值
 */
export function applyVariableDefaults(
  templateVariables: TemplateVariable[],
  userInputs: Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const tv of templateVariables) {
    const userValue = userInputs[tv.name]?.trim();
    if (userValue) {
      result[tv.name] = userValue;
    } else if (tv.default) {
      result[tv.name] = tv.default;
    }
  }

  return result;
}
