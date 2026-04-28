# SmartDoc AI — 架构记录

> 记录每个文件/模块的作用和相互关系。每完成一个重大功能后更新。

---

## 项目架构概览

（项目搭建后逐步填写）

## 文件说明

| 文件路径 | 作用 | 关键依赖 |
|---------|------|---------|
| （待填写） | | |

## 数据流

```
用户上传文档
    → 文件保存到 Supabase Storage
    → 后端提取文本
    → 文本切分为片段
    → 片段向量化（Embedding API）
    → 向量+原文存入 pgvector

用户提问
    → 问题向量化
    → pgvector 相似度搜索 Top 5 片段
    → 片段 + 问题 → LLM 生成回答
    → 回答 + 来源引用返回给用户
```

## 数据库关系

```
users (用户)
  └── knowledge_bases (知识库，1:N)
        └── documents (文档，1:N)
              └── document_chunks (文档片段+向量，1:N)
  └── conversations (对话，1:N)
        └── messages (消息，1:N)
```
