# SmartDoc AI — 实施计划

> Vibe Coding 原则：每一步小而具体，每步必须包含验证测试，严禁包含代码，只写清晰指令。

---

## 阶段 A：环境搭建与项目骨架（基础）

### Step 1: 安装开发环境
- 安装 Node.js 18+ LTS 版本
- 安装 pnpm 包管理器
- 安装 VS Code 编辑器
- 安装 Git 并配置 GitHub 账号
- **验证**: 终端运行 `node -v`、`pnpm -v`、`git --version` 均能输出版本号

### Step 2: 创建 Next.js 项目
- 使用 `pnpm create next-app` 创建项目，选择 TypeScript + Tailwind CSS + App Router
- 初始化 Git 仓库并首次提交
- **验证**: `pnpm dev` 启动后浏览器打开 localhost:3000 能看到默认页面

### Step 3: 安装核心依赖
- 安装 shadcn/ui 并初始化（添加 Button, Input, Card, Dialog 组件）
- 安装 @supabase/supabase-js（Supabase 客户端）
- 安装 drizzle-orm + drizzle-kit（数据库 ORM）
- 安装 zustand（状态管理）
- 安装 pdf-parse（PDF 解析）
- 安装 ai + openai（AI SDK）
- **验证**: `pnpm build` 无报错

### Step 4: 配置 Supabase
- 注册 Supabase 账号并创建项目
- 创建 .env.local 文件填入 Supabase URL 和 Anon Key
- 创建 Supabase 客户端工具文件（src/lib/supabase.ts，区分服务端和客户端）
- **验证**: 在 API 路由中能成功连接 Supabase

### Step 5: 建立数据库 Schema
- 使用 Drizzle ORM 定义以下表结构：
  - `users`（用户表）
  - `knowledge_bases`（知识库表，关联 user_id）
  - `documents`（文档表，关联 knowledge_base_id）
  - `document_chunks`（文档片段表，含 vector 字段用于向量搜索）
  - `conversations`（对话表）
  - `messages`（消息表）
- 启用 pgvector 扩展
- 运行数据库迁移
- **验证**: 在 Supabase 控制台能看到所有表

### Step 6: 搭建项目目录结构
- 按照 CLAUDE.md 中的目录结构创建所有文件夹
- 创建基础 layout.tsx（根布局）
- 创建 .env.example 环境变量模板
- **验证**: 目录结构与 CLAUDE.md 一致，`pnpm dev` 正常启动

---

## 阶段 B：用户认证

### Step 7: 实现注册页面
- 创建 /register 页面
- 使用 shadcn/ui 的 Input 和 Button 组件
- 实现表单验证（邮箱格式、密码长度 ≥ 8 位）
- 调用 Supabase Auth 注册 API
- **验证**: 能成功注册新用户，Supabase 控制台能看到用户

### Step 8: 实现登录页面
- 创建 /login 页面
- 实现邮箱+密码登录
- 登录成功后跳转到 /dashboard
- **验证**: 能用注册的账号登录并跳转

### Step 9: 实现认证中间件
- 创建 Next.js middleware 保护 /dashboard 等路由
- 未登录用户自动跳转到 /login
- 创建认证状态管理（Zustand store）
- **验证**: 未登录访问 /dashboard 会被拦截跳转到登录页

---

## 阶段 C：知识库管理

### Step 10: 仪表盘页面
- 创建 /dashboard 页面
- 展示用户的知识库列表（卡片布局）
- 添加「新建知识库」按钮和弹窗
- 实现知识库的创建和删除功能
- **验证**: 能创建和删除知识库，刷新后数据仍在

### Step 11: 知识库详情页
- 创建 /knowledge-base/[id] 页面
- 展示知识库下的文档列表
- 添加「上传文档」按钮
- **验证**: 能看到知识库的文档列表

### Step 12: 文档上传 API
- 创建 /api/documents/upload 路由
- 接收 PDF/TXT 文件，保存到 Supabase Storage
- 在 documents 表中创建记录
- **验证**: 能上传文件并在文档列表中显示

---

## 阶段 D：RAG 核心（最重要的部分）

### Step 13: 文档处理 — 文本提取
- 创建 src/lib/document.ts 工具模块
- 实现 PDF 文本提取（使用 pdf-parse）
- 实现 TXT 文件读取
- 实现文本清洗（去除特殊字符、多余空行）
- **验证**: 上传 PDF 后能正确提取出纯文本

### Step 14: 文档处理 — 文本切分
- 将提取的文本按固定长度切分（每段 500 字，重叠 50 字）
- 保留每段的元数据（来源文档、页码、位置）
- **验证**: 长文档被正确切分为多个片段，片段之间有重叠

### Step 15: 文档处理 — 向量化与存储
- 创建 src/lib/ai.ts 模块
- 调用 Embedding API 将文本片段转为向量
- 将向量和原文存入 document_chunks 表
- 更新文档状态为"已处理"
- **验证**: 处理后能在数据库中查到向量和原文

### Step 16: 语义检索
- 创建 src/lib/rag.ts 模块
- 实现向量相似度搜索：用户问题 → 向量化 → 在 pgvector 中搜索最相似的片段
- 返回 Top 5 最相关片段
- **验证**: 输入问题能返回相关文档片段

### Step 17: AI 问答生成
- 将检索到的片段作为上下文，构建 Prompt
- 调用 LLM API 生成回答
- 回答中标注来源（文档名 + 相关片段）
- **验证**: 能基于文档内容准确回答问题

---

## 阶段 E：对话界面

### Step 18: 对话页面 UI
- 创建 /chat/[id] 页面
- 左侧：知识库选择器
- 右侧：对话界面（消息列表 + 输入框）
- 消息气泡区分用户和 AI
- **验证**: 页面布局正确，能选择知识库

### Step 19: 对话 API
- 创建 /api/chat 路由
- 接收用户消息 → 调用 RAG 流程 → 返回 AI 回答
- 保存对话和消息到数据库
- **验证**: 发送问题能收到 AI 回答

### Step 20: 对话历史
- 实现对话列表展示
- 点击历史对话能查看完整消息记录
- 支持新建对话
- **验证**: 能看到历史对话，点击能查看详情

---

## 阶段 F：完善与上线

### Step 21: 流式输出
- 将问答 API 改为 Streaming 模式
- AI 回答逐字显示
- **验证**: 回答像 ChatGPT 一样逐字出现

### Step 22: 错误处理与加载状态
- 所有页面添加 loading 状态
- API 错误统一 toast 提示
- 空状态友好提示
- **验证**: 网络断开、API 报错时有友好提示

### Step 23: UI 打磨
- 响应式适配（手机 + 桌面）
- 统一配色和字体
- 添加 favicon 和页面标题
- **验证**: 手机和电脑上都能正常使用

### Step 24: 部署上线
- 将代码推送到 GitHub
- 连接 Vercel 部署
- 配置环境变量
- 绑定自定义域名（可选）
- **验证**: 通过公网 URL 能正常访问和使用

---

## 进度跟踪

| 阶段 | 步骤 | 状态 | 完成日期 |
|------|------|------|---------|
| A 环境搭建 | Step 1-6 | ⬜ 未开始 | - |
| B 用户认证 | Step 7-9 | ⬜ 未开始 | - |
| C 知识库管理 | Step 10-12 | ⬜ 未开始 | - |
| D RAG 核心 | Step 13-17 | ⬜ 未开始 | - |
| E 对话界面 | Step 18-20 | ⬜ 未开始 | - |
| F 完善上线 | Step 21-24 | ⬜ 未开始 | - |
