import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core";

// ==================== 知识库表 ====================

export const knowledgeBases = pgTable("knowledge_bases", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==================== 文档表 ====================

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  knowledgeBaseId: uuid("knowledge_base_id").notNull().references(() => knowledgeBases.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // pdf, txt, md
  storagePath: text("storage_path").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, ready, error
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==================== 文档片段表（含向量） ====================

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
    knowledgeBaseId: uuid("knowledge_base_id").notNull().references(() => knowledgeBases.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata"), // { page, position, source }
    embedding: vector("embedding", { dimensions: 1024 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("document_chunks_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);

// ==================== 对话表 ====================

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  knowledgeBaseId: uuid("knowledge_base_id").references(() => knowledgeBases.id, { onDelete: "set null" }),
  title: text("title").notNull().default("新对话"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==================== 消息表 ====================

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  sources: jsonb("sources"), // 引用来源 [{ documentName, chunkContent, page }]
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==================== 文档模板表 ====================

export const docTemplates = pgTable("doc_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id"), // NULL = 系统内置模板
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  isSystem: boolean("is_system").notNull().default(false),
  sections: jsonb("sections").notNull(), // TemplateSection[]
  variables: jsonb("variables").notNull().default([]), // TemplateVariable[]
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==================== 生成文档表 ====================

export const generatedDocuments = pgTable("generated_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  templateId: uuid("template_id").notNull().references(() => docTemplates.id, { onDelete: "cascade" }),
  knowledgeBaseIds: jsonb("knowledge_base_ids").notNull().default([]), // UUID[]
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"), // draft, generating, completed, error
  variables: jsonb("variables").notNull().default({}), // Record<string, string>
  sectionsContent: jsonb("sections_content").notNull().default([]), // SectionContent[]
  fullContent: text("full_content"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
