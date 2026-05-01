import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/ai";
import type { MessageSource } from "@/types";

// ==================== 语义检索 ====================

export interface SearchResult {
  id: string;
  content: string;
  documentId: string;
  documentName: string;
  knowledgeBaseId: string;
  similarity: number;
  metadata: Record<string, unknown> | null;
}

/**
 * 语义检索：将用户问题转为向量，在指定知识库中搜索最相似的文档片段
 * 支持同时指定多个知识库
 */
export async function searchSimilarChunks(
  query: string,
  knowledgeBaseIds: string[],
  userId: string,
  topK = 5
): Promise<SearchResult[]> {
  // Step 1: 将问题转为向量
  const queryEmbedding = await generateEmbedding(query);

  // Step 2: 调用 Supabase RPC 进行向量相似度搜索（传 UUID 数组）
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: `[${queryEmbedding.join(",")}]`,
    match_knowledge_base_ids: knowledgeBaseIds,
    match_user_id: userId,
    match_count: topK,
  });

  if (error) {
    throw new Error(`语义检索失败: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Step 3: 获取相关文档名称
  const documentIds = [...new Set(data.map((r: { document_id: string }) => r.document_id))];
  const { data: docs } = await supabase
    .from("documents")
    .select("id, name")
    .in("id", documentIds);

  const docNameMap = new Map<string, string>();
  if (docs) {
    for (const doc of docs) {
      docNameMap.set(doc.id, doc.name);
    }
  }

  return data.map((row: {
    id: string;
    content: string;
    document_id: string;
    knowledge_base_id: string;
    metadata: Record<string, unknown> | null;
    similarity: number;
  }) => ({
    id: row.id,
    content: row.content,
    documentId: row.document_id,
    documentName: docNameMap.get(row.document_id) || "未知文档",
    knowledgeBaseId: row.knowledge_base_id,
    similarity: row.similarity,
    metadata: row.metadata,
  }));
}

// ==================== Prompt 构建 ====================

export const SYSTEM_PROMPT = `你是 SmartDoc AI 智能文档助手。你的任务是基于提供的文档内容准确回答用户的问题。

规则：
1. 只根据提供的文档内容回答，不要编造信息
2. 如果文档中没有相关内容，如实告知用户
3. 回答要清晰、有条理，使用中文
4. 引用具体内容时标注来源文档名
5. 如果用户的问题不够明确，可以追问`;

/**
 * 构建 RAG 上下文 Prompt
 */
export function buildRAGPrompt(
  searchResults: SearchResult[]
): string {
  if (searchResults.length === 0) {
    return "未找到与问题相关的文档内容。请告知用户目前知识库中没有相关文档，建议上传更多相关文档。";
  }

  const contextParts = searchResults.map((result, i) => {
    return `[文档: ${result.documentName}]\n${result.content}`;
  });

  return `以下是与用户问题相关的文档内容：

${contextParts.join("\n\n---\n\n")}

请基于以上文档内容回答用户的问题。如果文档内容不足以回答问题，请如实说明。`;
}

/**
 * 从检索结果中提取引用来源
 */
export function extractSources(results: SearchResult[]): MessageSource[] {
  return results.map((r) => ({
    documentName: r.documentName,
    chunkContent: r.content.slice(0, 200) + (r.content.length > 200 ? "..." : ""),
  }));
}
