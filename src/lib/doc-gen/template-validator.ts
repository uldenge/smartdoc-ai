import type { TemplateSection, TemplateVariable, TemplateCategory } from "@/types";

const VALID_CATEGORIES: TemplateCategory[] = ["general", "technical", "requirement", "design"];
const MAX_SECTIONS = 50;
const MAX_VARIABLES = 20;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateTemplate(data: {
  name: string;
  description?: string;
  category: string;
  sections: TemplateSection[];
  variables: TemplateVariable[];
}): ValidationResult {
  const errors: Record<string, string> = {};

  // 名称验证
  const name = data.name?.trim() || "";
  if (!name) {
    errors["name"] = "模板名称不能为空";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors["name"] = `名称不能超过 ${MAX_NAME_LENGTH} 个字符`;
  }

  // 描述验证
  if (data.description && data.description.length > MAX_DESCRIPTION_LENGTH) {
    errors["description"] = `描述不能超过 ${MAX_DESCRIPTION_LENGTH} 个字符`;
  }

  // 分类验证
  if (!VALID_CATEGORIES.includes(data.category as TemplateCategory)) {
    errors["category"] = "请选择有效的分类";
  }

  // 章节验证
  if (!data.sections || data.sections.length === 0) {
    errors["sections"] = "至少需要定义一个章节";
  } else if (data.sections.length > MAX_SECTIONS) {
    errors["sections"] = `章节数量不能超过 ${MAX_SECTIONS} 个`;
  } else {
    data.sections.forEach((s, i) => {
      if (!s.title?.trim()) {
        errors[`sections[${i}].title`] = "章节标题不能为空";
      }
      if (!s.prompt_hint?.trim()) {
        errors[`sections[${i}].prompt_hint`] = "AI 生成提示不能为空";
      }
    });
  }

  // 变量验证
  if (data.variables && data.variables.length > MAX_VARIABLES) {
    errors["variables"] = `变量数量不能超过 ${MAX_VARIABLES} 个`;
  } else if (data.variables && data.variables.length > 0) {
    const names = new Set<string>();
    data.variables.forEach((v, i) => {
      const varName = v.name?.trim() || "";
      if (!varName) {
        errors[`variables[${i}].name`] = "变量名不能为空";
      } else if (!/^\w+$/.test(varName)) {
        errors[`variables[${i}].name`] = "变量名只能包含字母、数字和下划线";
      } else if (names.has(varName)) {
        errors[`variables[${i}].name`] = `变量名 "${varName}" 已存在`;
      } else {
        names.add(varName);
      }

      if (!v.label?.trim()) {
        errors[`variables[${i}].label`] = "变量标签不能为空";
      }

      if (v.type === "select" && (!v.options || v.options.length === 0)) {
        errors[`variables[${i}].options`] = "下拉选择类型必须至少有一个选项";
      }
    });
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export { VALID_CATEGORIES, MAX_SECTIONS, MAX_VARIABLES, MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH };
