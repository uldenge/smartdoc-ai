import matter from "gray-matter";
import type {
  TemplateSection,
  TemplateVariable,
  TemplateCategory,
  CreateTemplateInput,
} from "@/types";

const VALID_CATEGORIES: TemplateCategory[] = [
  "general",
  "technical",
  "requirement",
  "design",
];

const MAX_SECTIONS = 50;
const MAX_VARIABLES = 20;
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

export interface TemplateParseResult {
  success: boolean;
  data?: CreateTemplateInput;
  errors: string[];
}

/**
 * 解析 Markdown 模板文件为结构化模板数据
 *
 * 格式约定：
 * - --- 之间的 YAML frontmatter 定义 name, description, category, variables
 * - ## 二级标题定义章节
 * - <!-- prompt: ... --> HTML 注释定义章节的 AI 生成提示
 * - {{variable_name}} 占位符在生成时被替换
 */
export function parseTemplateMarkdown(content: string): TemplateParseResult {
  const errors: string[] = [];

  // 1. 解析 frontmatter
  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(content);
  } catch {
    return { success: false, errors: ["YAML frontmatter 解析失败，请检查格式"] };
  }

  const frontmatter = parsed.data || {};
  const body = parsed.content || "";

  // 2. 提取并验证元信息
  const name = String(frontmatter.name || "").trim().slice(0, MAX_NAME_LENGTH);
  if (!name) {
    errors.push("模板名称 (name) 不能为空，请在 frontmatter 中设置 name 字段");
  }

  const description = String(frontmatter.description || "").trim().slice(0, MAX_DESCRIPTION_LENGTH);

  const rawCategory = String(frontmatter.category || "general").trim();
  const category: TemplateCategory = VALID_CATEGORIES.includes(rawCategory as TemplateCategory)
    ? (rawCategory as TemplateCategory)
    : "general";

  // 3. 提取章节
  const sections = extractSections(body);
  if (sections.length === 0) {
    errors.push("未找到任何章节，请使用 ## 二级标题定义至少一个章节");
  }
  if (sections.length > MAX_SECTIONS) {
    errors.push(`章节数量超过限制（最多 ${MAX_SECTIONS} 个）`);
  }

  // 4. 解析声明的变量
  const declaredVariables = parseDeclaredVariables(frontmatter.variables);

  // 5. 自动检测未声明的变量
  const allVariables = autoDetectVariables(sections, declaredVariables);
  if (allVariables.length > MAX_VARIABLES) {
    errors.push(`变量数量超过限制（最多 ${MAX_VARIABLES} 个）`);
  }

  // 6. 如果有错误，返回
  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name,
      description: description || undefined,
      category,
      sections,
      variables: allVariables,
    },
    errors: [],
  };
}

/**
 * 从 Markdown body 中提取章节
 * 每章节由 ## 标题 + 可选的 <!-- prompt: ... --> 注释组成
 */
function extractSections(body: string): TemplateSection[] {
  const sections: TemplateSection[] = [];
  const lines = body.split("\n");

  let currentSection: { title: string; description: string; promptHint: string } | null = null;
  let descriptionLines: string[] = [];

  for (const line of lines) {
    // 匹配 ## 二级标题
    const headingMatch = line.match(/^##\s+(.+)$/);
    // 匹配 <!-- prompt: ... --> 注释
    const promptMatch = line.match(/<!--\s*prompt:\s*(.+?)\s*-->/);

    if (headingMatch) {
      // 保存上一个章节
      if (currentSection) {
        currentSection.description = descriptionLines.join(" ").trim();
        sections.push(buildSection(currentSection, sections.length));
      }
      currentSection = {
        title: headingMatch[1].trim(),
        description: "",
        promptHint: "",
      };
      descriptionLines = [];
    } else if (promptMatch && currentSection) {
      currentSection.promptHint = promptMatch[1].trim();
    } else if (currentSection) {
      // 收集描述文本（跳过空行、H1 标题、纯注释行）
      const trimmed = line.trim();
      if (
        trimmed &&
        !trimmed.startsWith("#") &&
        !trimmed.startsWith("<!--") &&
        !trimmed.startsWith("-->")
      ) {
        descriptionLines.push(trimmed);
      }
    }
  }

  // 保存最后一个章节
  if (currentSection) {
    currentSection.description = descriptionLines.join(" ").trim();
    sections.push(buildSection(currentSection, sections.length));
  }

  return sections;
}

function buildSection(
  section: { title: string; description: string; promptHint: string },
  index: number
): TemplateSection {
  return {
    id: `s${index + 1}`,
    title: section.title,
    description: section.description || `${section.title}相关内容`,
    prompt_hint:
      section.promptHint || `请撰写${section.title}相关内容`,
    required: true,
  };
}

/**
 * 解析 frontmatter 中声明的变量
 */
function parseDeclaredVariables(
  raw: unknown
): TemplateVariable[] {
  if (!Array.isArray(raw)) return [];

  const variables: TemplateVariable[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;

    const name = String(item.name || "").trim();
    if (!name || !/^\w+$/.test(name)) continue;

    const type = ["text", "textarea", "select"].includes(item.type)
      ? item.type
      : "text";

    variables.push({
      name,
      label: String(item.label || name).trim(),
      type: type as "text" | "textarea" | "select",
      required: Boolean(item.required),
      ...(item.default ? { default: String(item.default) } : {}),
      ...(Array.isArray(item.options) ? { options: item.options.map(String) } : {}),
    });
  }

  return variables;
}

/**
 * 自动检测 prompt_hint 中的 {{var}} 占位符，
 * 补充已声明变量中未包含的变量
 */
function autoDetectVariables(
  sections: TemplateSection[],
  declaredVariables: TemplateVariable[]
): TemplateVariable[] {
  const declaredNames = new Set(declaredVariables.map((v) => v.name));
  const detectedNames = new Set<string>();

  // 扫描所有 prompt_hint 中的 {{variable_name}}
  const varPattern = /\{\{(\w+)\}\}/g;
  for (const section of sections) {
    let match: RegExpExecArray | null;
    const tempPattern = new RegExp(varPattern.source, varPattern.flags);
    while ((match = tempPattern.exec(section.prompt_hint)) !== null) {
      detectedNames.add(match[1]);
    }
  }

  // 补充未声明的变量
  const additional: TemplateVariable[] = [];
  for (const name of detectedNames) {
    if (!declaredNames.has(name)) {
      additional.push({
        name,
        label: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        type: "text",
        required: false,
      });
    }
  }

  // 声明的变量在前，自动检测的在后
  return [...declaredVariables, ...additional];
}
