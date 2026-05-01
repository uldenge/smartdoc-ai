/**
 * 章节级 Prompt 构建器
 * 与现有 RAG 管道（rag.ts）协同工作
 */

/**
 * 构建章节生成的系统提示
 */
export function buildSectionSystemPrompt(
  sectionTitle: string,
  sectionDescription: string
): string {
  return `你是专业的技术文档撰写专家。你正在撰写文档的「${sectionTitle}」章节。

章节描述：${sectionDescription}

要求：
1. 内容专业、准确，必须基于提供的参考资料撰写
2. 使用 Markdown 格式，以 ## 开头作为章节标题
3. 层次分明，逻辑清晰，适当使用子标题（###）
4. 如有必要可包含表格、列表、代码块等
5. 直接输出章节内容，不要输出多余的解释或前言`;
}

/**
 * 构建章节生成的用户提示（结合 RAG 上下文）
 */
export function buildSectionUserPrompt(
  resolvedHint: string,
  ragContext: string
): string {
  return `参考资料：
${ragContext}

---

请根据以上参考资料，撰写以下内容：
${resolvedHint}

注意：内容必须基于参考资料中的信息，如果参考资料中没有相关信息，请基于专业知识合理推断并标注。`;
}
