import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

// ==================== Embedding（阿里百炼 DashScope，直连 API）====================

const EMBEDDING_MODEL = "text-embedding-v3";
const EMBEDDING_DIMENSIONS = 1024;

/**
 * 调用阿里百炼 Embedding API（OpenAI 兼容格式）
 * 直接用 fetch 调用，支持 dimensions 参数
 */
async function callEmbeddingAPI(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("EMBEDDING_API_KEY 或 OPENAI_API_KEY 未配置");
  }

  const baseURL =
    process.env.EMBEDDING_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const modelName = process.env.EMBEDDING_MODEL || EMBEDDING_MODEL;

  // 每批最多 25 条（阿里百炼限制）
  const batchSize = 25;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const response = await fetch(`${baseURL}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        input: batch,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Embedding API 错误 (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const batchEmbeddings: number[][] = data.data
      .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
      .map((item: { embedding: number[] }) => item.embedding);

    allEmbeddings.push(...batchEmbeddings);
  }

  return allEmbeddings;
}

/**
 * 将单个文本转为向量
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddings = await callEmbeddingAPI([text]);
  return embeddings[0];
}

/**
 * 批量将文本转为向量
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  return callEmbeddingAPI(texts);
}

// ==================== Chat（DeepSeek）====================

const CHAT_MODEL = "deepseek-chat";

let _chatClient: ReturnType<typeof createOpenAI> | null = null;

function getChatClient() {
  if (!_chatClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY 未配置");
    }

    const baseURL = process.env.OPENAI_BASE_URL || undefined;
    _chatClient = createOpenAI({ apiKey, baseURL });
  }
  return _chatClient;
}

/**
 * 流式生成 AI 回答（用于对话）
 */
export function streamChat(messages: Array<{ role: "user" | "assistant" | "system"; content: string }>) {
  return streamText({
    model: getChatClient()(CHAT_MODEL),
    messages,
  });
}

/**
 * 非流式生成 AI 回答（用于一次性获取完整回答）
 */
export async function generateChat(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>
): Promise<string> {
  const result = await streamChat(messages);
  return (await result.text) ?? "";
}

// ==================== 状态检查 ====================

/**
 * 检查 Embedding API 是否已配置
 */
export function isEmbeddingConfigured(): boolean {
  return !!(
    process.env.EMBEDDING_API_KEY ||
    process.env.OPENAI_API_KEY
  );
}

/**
 * 检查 Chat API 是否已配置
 */
export function isChatConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * 检查所有 AI 功能是否就绪
 */
export function isAIConfigured(): boolean {
  return isEmbeddingConfigured() && isChatConfigured();
}
