// ==================== 知识库 ====================

export interface KnowledgeBase {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeBaseInput {
  name: string;
  description?: string;
}

// ==================== 文档 ====================

export type DocumentStatus = "pending" | "processing" | "ready" | "error";

export interface Document {
  id: string;
  knowledgeBaseId: string;
  userId: string;
  name: string;
  type: "pdf" | "txt" | "md" | "docx" | "pptx" | "xlsx" | "epub";
  storagePath: string;
  sizeBytes: number;
  status: DocumentStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==================== 文档片段 ====================

export interface DocumentChunk {
  id: string;
  documentId: string;
  knowledgeBaseId: string;
  userId: string;
  content: string;
  metadata: ChunkMetadata | null;
  createdAt: string;
}

export interface ChunkMetadata {
  page?: number;
  position?: number;
  source?: string;
}

// ==================== 对话 ====================

export interface Conversation {
  id: string;
  userId: string;
  knowledgeBaseId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== 消息 ====================

export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  role: MessageRole;
  content: string;
  sources: MessageSource[] | null;
  createdAt: string;
}

export interface MessageSource {
  documentName: string;
  chunkContent: string;
  page?: number;
}

// ==================== API 响应 ====================

export interface ApiError {
  error: string;
  code: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

// ==================== 用户 ====================

export interface User {
  id: string;
  email: string;
}
