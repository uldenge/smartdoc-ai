import { createOpenAI } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";

// ==================== Embedding ====================

const EMBEDDING_MODEL = "text-embedding-3-small";

let _embeddingClient: ReturnType<typeof createOpenAI> | null = null;

function getEmbeddingClient() {
  if (!_embeddingClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY 未配置");
    }

    // 支持自定义 base URL（兼容 DeepSeek 等兼容 API）
    const baseURL = process.env.OPENAI_BASE_URL || undefined;

    _embeddingClient = createOpenAI({ apiKey, baseURL });
  }
  return _embeddingClient;
}

/**
 * 将单个文本转为向量
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getEmbeddingClient();
  const { embedding } = await embed({
    model: client.embedding(EMBEDDING_MODEL),
    value: text,
  });
  return embedding;
}

/**
 * 批量将文本转为向量
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const client = getEmbeddingClient();

  // AI SDK embedMany 限制每次最多 100 条
  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const { embeddings } = await embedMany({
      model: client.embedding(EMBEDDING_MODEL),
      values: batch,
    });
    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}

/**
 * 检查 API Key 是否已配置
 */
export function isAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
