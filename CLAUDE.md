# SmartDoc AI — AI Agent 行为规则

## 项目概述
SmartDoc AI 是一个 AI 知识库问答系统。用户上传文档，系统自动构建知识库，用户可以用自然语言提问获得精准回答。

## 技术栈
- 前端：Next.js 14+ (App Router) + TypeScript + shadcn/ui + Tailwind CSS
- 后端：Next.js API Routes + Drizzle ORM
- 数据库：Supabase (PostgreSQL + pgvector)
- AI：OpenAI / DeepSeek / 智谱 API
- 部署：Vercel

---

## 必须遵守的规则

### 架构规则
1. **模块化优先**：每个功能拆分为独立文件，严禁创建超过 300 行的单文件
2. **禁止 monolith**：不允许把所有逻辑放在一个文件里
3. **接口先行，实现后补**：先定义类型/接口，再写实现
4. **先结构，后代码**：先建立文件和目录结构，再填充代码

### 代码规则
5. 使用 TypeScript strict 模式，不允许 any 类型
6. 所有 API 接口必须有输入验证
7. 错误处理使用统一的错误格式：`{ error: string, code: string }`
8. 数据库操作必须使用 Drizzle ORM，禁止手写 SQL
9. 所有用户输入必须 sanitize，防止 XSS
10. API Key 等敏感信息只能通过环境变量读取

### 文件组织
11. 组件放在 `src/components/` 下，按功能分子目录
12. API 路由放在 `src/app/api/` 下
13. 共享类型放在 `src/types/` 下
14. 工具函数放在 `src/lib/` 下
15. 数据库相关放在 `src/db/` 下

### 数据库规则
16. 所有表必须有 `id`（uuid）、`created_at`、`updated_at` 字段
17. 用户数据必须通过 `user_id` 隔离
18. 向量数据使用 pgvector 的 `vector(1536)` 类型

### 开发流程
19. 写任何代码前必须阅读 memory-bank/ 下的所有文档
20. 每完成一个功能，更新 memory-bank/progress.md
21. 遇到架构变化，更新 memory-bank/architecture.md
22. 每个功能必须有对应的错误处理和加载状态

---

## 项目目录结构

```
smartdoc-ai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 首页（登录/注册）
│   │   ├── (auth)/             # 认证相关页面
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/        # 登录后的页面
│   │   │   ├── dashboard/page.tsx    # 仪表盘
│   │   │   ├── knowledge-base/       # 知识库管理
│   │   │   │   └── [id]/page.tsx     # 知识库详情
│   │   │   └── chat/                 # 对话页
│   │   │       └── [id]/page.tsx     # 具体对话
│   │   └── api/                # API 路由
│   │       ├── auth/           # 认证接口
│   │       ├── knowledge-base/ # 知识库接口
│   │       ├── documents/      # 文档上传/处理
│   │       └── chat/           # 问答接口
│   ├── components/             # UI 组件
│   │   ├── ui/                 # shadcn 基础组件
│   │   ├── chat/               # 对话相关组件
│   │   ├── knowledge-base/     # 知识库相关组件
│   │   └── layout/             # 布局组件
│   ├── lib/                    # 工具函数
│   │   ├── supabase.ts         # Supabase 客户端
│   │   ├── ai.ts               # AI 模型调用
│   │   ├── rag.ts              # RAG 核心逻辑
│   │   └── document.ts         # 文档处理
│   ├── db/                     # 数据库
│   │   ├── index.ts            # 数据库连接
│   │   ├── schema.ts           # 表结构定义
│   │   └── migrations/         # 迁移文件
│   └── types/                  # TypeScript 类型定义
│       └── index.ts
├── memory-bank/                # 项目记忆库
│   ├── prd.md
│   ├── tech-stack.md
│   ├── implementation-plan.md
│   ├── progress.md
│   └── architecture.md
├── public/                     # 静态资源
├── .env.local                  # 环境变量（不入 Git）
├── .env.example                # 环境变量示例
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── CLAUDE.md                   # 本文件
```
