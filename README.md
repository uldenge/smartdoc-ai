# SmartDoc AI — AI 知识库问答系统

上传文档，构建知识库，用自然语言提问获得精准回答。基于 RAG（检索增强生成）技术的 AI 知识库问答系统。

## 功能特性

- 📄 **文档上传** — 支持 PDF、TXT、Markdown 格式，一键上传自动解析
- 🔍 **语义检索** — 基于向量数据库（pgvector）的语义搜索，精准定位知识片段
- 💬 **AI 问答** — 基于文档内容的精准回答，流式输出，标注来源引用
- 📚 **知识库管理** — 创建、删除知识库，多文档管理
- 👤 **用户认证** — 注册、登录、路由保护
- 📱 **响应式设计** — 桌面端侧边栏 + 移动端抽屉菜单

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 16 (App Router) + TypeScript + shadcn/ui + Tailwind CSS |
| 后端 | Next.js API Routes |
| 数据库 | Supabase (PostgreSQL + pgvector) |
| AI Chat | DeepSeek (deepseek-chat) |
| AI Embedding | 阿里百炼 DashScope (text-embedding-v3) |
| 存储 | Supabase Storage |

## 本地运行

### 前置要求

- **Node.js** 18+ LTS
- **pnpm** 包管理器
- **Git**
- **Supabase** 账号（免费）
- **DeepSeek** API Key（或 OpenAI）
- **阿里百炼** API Key（用于 Embedding）

### 1. 克隆项目

```bash
git clone https://github.com/uldenge/smartdoc-ai.git
cd smartdoc-ai
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置 Supabase

1. 注册 [Supabase](https://supabase.com) 并创建一个新项目
2. 在项目设置中获取 **Project URL** 和 **anon public Key**
3. 进入 Database → Extensions，启用 `vector` 扩展
4. 进入 SQL Editor，执行以下 SQL 创建数据库表：

```sql
-- 知识库表
CREATE TABLE knowledge_bases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 文档表
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  knowledge_base_id UUID REFERENCES knowledge_bases(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  storage_path TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 文档片段表（含向量）
CREATE TABLE document_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1024),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 对话表
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  knowledge_base_id UUID REFERENCES knowledge_bases(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 消息表
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 向量索引
CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- 语义搜索函数
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1024),
  match_knowledge_base_id UUID,
  match_user_id UUID,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.user_id = match_user_id
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Storage bucket
INSERT INTO storage.buckets (id, name, file_size_limit)
VALUES ('documents', 'documents', 10485760);

-- RLS 策略
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能操作自己的知识库" ON knowledge_bases FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "用户只能操作自己的文档" ON documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "用户只能操作自己的文档片段" ON document_chunks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "用户只能操作自己的对话" ON conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "用户只能操作自己的消息" ON messages FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "用户上传文件" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "用户读取文件" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "用户删除文件" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

5. （可选）开发环境关闭邮箱确认：Settings → Authentication → Email → 关闭 "Confirm email"

### 4. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的真实配置：

```env
# Supabase（必填）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Chat（必填 — 支持 DeepSeek / OpenAI）
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.deepseek.com

# AI Embedding（必填 — 推荐阿里百炼）
EMBEDDING_API_KEY=your-dashscope-key
EMBEDDING_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
EMBEDDING_MODEL=text-embedding-v3
```

**API Key 获取方式：**

| 服务 | 注册地址 | 免费额度 |
|------|---------|---------|
| DeepSeek Chat | https://platform.deepseek.com | 注册送额度 |
| 阿里百炼 Embedding | https://dashscope.console.aliyun.com | 注册送额度 |
| Supabase | https://supabase.com | 免费套餐 |

### 5. 启动开发服务器

```bash
pnpm dev
```

浏览器打开 **http://localhost:3000** 即可使用。

### 6. 构建生产版本

```bash
pnpm build
pnpm start
```

## 使用流程

1. **注册/登录** — 首页点击注册，创建账号
2. **创建知识库** — 在仪表盘点击「新建知识库」
3. **上传文档** — 进入知识库详情，上传 PDF/TXT/MD 文件
4. **等待处理** — 系统自动解析、分块、向量化（约 10-30 秒）
5. **开始问答** — 文档状态变为「已就绪」后，点击「开始对话」
6. **AI 回答** — 输入问题，AI 基于文档内容精准回答并标注来源

## 项目结构

```
smartdoc-ai/
├── src/
│   ├── app/                    # Next.js 页面和 API
│   │   ├── (auth)/             # 登录、注册页面
│   │   ├── (dashboard)/        # 仪表盘、知识库、对话页面
│   │   └── api/                # 12 个 API 端点
│   ├── components/             # UI 组件
│   │   ├── ui/                 # shadcn/ui 基础组件
│   │   ├── chat/               # 聊天组件（消息列表、输入框）
│   │   ├── knowledge-base/     # 知识库组件
│   │   ├── auth/               # 认证表单
│   │   └── layout/             # 侧边栏
│   ├── lib/                    # 核心逻辑
│   │   ├── ai.ts               # AI 调用（Embedding + Chat）
│   │   ├── rag.ts              # RAG 管道（检索 + 上下文）
│   │   ├── document.ts         # 文档处理（提取 + 分块）
│   │   └── supabase/           # Supabase 客户端
│   ├── db/                     # 数据库 Schema
│   └── types/                  # TypeScript 类型
├── memory-bank/                # 项目文档（PRD、进度等）
├── .env.local                  # 环境变量（不入 Git）
└── .env.example                # 环境变量模板
```

## 部署到 Vercel

1. 打开 [vercel.com](https://vercel.com)，用 GitHub 登录
2. 导入 `uldenge/smartdoc-ai` 仓库
3. Framework 自动检测为 Next.js
4. 在 **Settings → Environment Variables** 中添加 `.env.local` 里的所有变量
5. 点击 Deploy

## License

MIT
