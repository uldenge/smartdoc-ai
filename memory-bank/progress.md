# SmartDoc AI — 开发进度记录

> 每完成一个步骤，在这里记录做了什么、遇到的问题、解决方案。供 AI 后续开发参考。

---

## 当前状态
- **当前阶段**: 阶段 F — UI 打磨 + 部署
- **当前步骤**: Step 17（下一步）
- **已完成步骤**: Step 1 ~ Step 16（错误处理 + Toast 通知 + 加载状态）
- **下一步行动**: UI 打磨（响应式、配色、favicon）

---

## 进度日志

### 2026-04-28 — Step 1: 安装开发环境
- **做了什么**: 检查已有工具（Node.js v24.13.1、Git v2.53.0 已安装），通过 npm 全局安装 pnpm v10.33.2
- **遇到的问题**: 无
- **解决方案**: N/A
- **架构变化**: 无
- **待办**: 无

### 2026-04-28 — Step 2: 创建 Next.js 项目
- **做了什么**:
  - 使用 pnpm create next-app 创建 Next.js 16.2.4 项目（TypeScript + Tailwind CSS + App Router + src 目录 + Turbopack）
  - 将规划文件（CLAUDE.md、prd.md、tech-stack.md、implementation-plan.md、memory-bank/）移入项目
  - 配置 Git 用户信息（uldenge / 27842463@qq.com）
  - 首次 Git 提交（28 files, 5375 insertions）
  - 验证 `pnpm dev` 启动成功（617ms）
- **遇到的问题**: Git 未配置用户信息导致首次提交失败
- **解决方案**: 用户提供用户名和邮箱后配置成功
- **架构变化**: 项目创建在 D:/newmax/workspace/smartdoc-ai/
- **待办**: 无

### 2026-04-28 — Step 3: 安装核心依赖
- **做了什么**:
  - 初始化 shadcn/ui（New York 风格，Tailwind v4）
  - 添加 11 个 UI 组件：button, input, card, dialog, label, textarea, dropdown-menu, avatar, separator, scroll-area, sheet, tooltip
  - 安装后端依赖：@supabase/supabase-js, @supabase/ssr, drizzle-orm, postgres, drizzle-kit (dev), zustand
  - 安装 AI 依赖：ai (Vercel AI SDK), @ai-sdk/openai, pdf-parse
  - 验证 `pnpm build` 成功（Compiled in 6.2s, 零报错）
- **遇到的问题**: 无
- **解决方案**: N/A
- **架构变化**: src/components/ui/ 下新增 11 个 shadcn 组件，src/lib/utils.ts 新增 cn 工具函数
- **待办**: 无

### 2026-04-28 — Step 4: 配置 Supabase
- **做了什么**:
  - 用户在 supabase.com 注册账号并创建项目 smartdoc-ai
  - 获取 Project URL (https://mkjtwszlvmemxwqhydor.supabase.co) 和 anon public Key
  - 创建 .env.local（含 Supabase 凭证）和 .env.example（模板）
  - 创建 Supabase 客户端文件：client.ts（浏览器端）、server.ts（服务端）、middleware.ts（会话刷新）
  - 创建 Next.js middleware 用于自动刷新认证会话
  - 验证 `pnpm build` 成功
- **遇到的问题**: 浏览器会话超时断开
- **解决方案**: 改为手动操作指导，用户自行在浏览器注册 Supabase
- **架构变化**: 新增 src/lib/supabase/ 目录（3 个文件）、src/middleware.ts
- **待办**: 用户需在 Supabase Dashboard 启用 pgvector 扩展，DATABASE_URL 和 OPENAI_API_KEY 后续填写

### 2026-04-28 — Step 5: 建立数据库 Schema
- **做了什么**:
  - 通过 Supabase Management API 启用 pgvector 扩展
  - 通过 Supabase SQL API 创建 5 张表：knowledge_bases, documents, document_chunks(含 vector(1536) + HNSW 索引), conversations, messages
  - 创建 Drizzle ORM Schema 定义文件 (src/db/schema.ts)
  - 创建数据库连接文件 (src/db/index.ts)
  - 配置 drizzle-kit (drizzle.config.ts) 和 db:push/db:generate 脚本
  - 验证所有表创建成功、`pnpm build` 通过
- **遇到的问题**:
  - 本地网络无法直连 Supabase 数据库（DNS 解析失败），drizzle-kit push 无法使用
  - 最初用了错误的组织 ID
  - DATABASE_URL 中密码特殊字符需要 URL 编码
- **解决方案**:
  - 改用 Supabase SQL API 直接建表，绕过网络限制
  - 通过 Management API 获取正确的组织 ID (fidkzbtijadztxrkzyfk)
  - 后续数据库操作将通过 Supabase Client 完成，而非 Drizzle 直连
- **架构变化**: 新增 src/db/ 目录（schema.ts, index.ts）、drizzle.config.ts
- **待办**: 部署时需确保 DATABASE_URL 可达，或继续使用 Supabase Client 模式

### 2026-04-29 — Step 6: 搭建项目目录结构
- **做了什么**:
  - 创建完整路由组结构：(auth)/login、(auth)/register、(dashboard)/dashboard、(dashboard)/knowledge-base/[id]、(dashboard)/chat/[id]
  - 创建 API 路由目录：api/auth、api/knowledge-base、api/documents、api/chat
  - 创建组件目录：components/chat、components/knowledge-base、components/layout
  - 添加 TypeScript 类型定义（KnowledgeBase, Document, DocumentChunk, Conversation, Message 等）
  - 更新根布局（中文 lang、SmartDoc AI metadata）
  - 创建首页 Landing Page（登录/注册入口）
  - 创建 (auth) 和 (dashboard) 路由组各自的布局
- **遇到的问题**: shadcn/ui 新版（base-ui）不支持 asChild prop，Button 组件使用 render prop
- **解决方案**: 改用 `render={<Link href="..." />}` 语法
- **架构变化**: 完整目录结构已就位，7 个路由全部注册成功
- **待办**: 无

### 2026-04-29 — Step 7: 实现注册页面
- **做了什么**:
  - 创建注册 API 路由 (POST /api/auth/register)，含完整输入验证
  - 创建 RegisterForm 客户端组件（邮箱、密码、确认密码）
  - 前后端双重验证：空字段、邮箱格式、密码长度≥8、密码一致性
  - 注册成功跳转到 /login?registered=true
  - 测试验证：空字段→MISSING_FIELDS、错误邮箱→INVALID_EMAIL、短密码→PASSWORD_TOO_SHORT、正常注册→成功、重复注册→Supabase 限流保护
- **遇到的问题**: 无
- **解决方案**: N/A
- **架构变化**: 新增 src/components/auth/ 目录、src/app/api/auth/register/ 路由
- **待办**: 无

### 2026-04-29 — Step 8: 实现登录页面
- **做了什么**:
  - 创建登录 API 路由 (POST /api/auth/login)，含输入验证和 Supabase Auth signInWithPassword
  - 创建 LoginForm 客户端组件（邮箱+密码、注册成功提示、错误处理、加载状态）
  - 登录页用 Suspense 包裹（Next.js 15+ 要求 useSearchParams 必须在 Suspense 内）
  - 通过 Supabase Management API 关闭邮箱确认要求（开发环境用 mailer_autoconfirm=true）
  - 测试验证：空字段→MISSING_FIELDS、错误密码→LOGIN_FAILED、正确登录→成功
- **遇到的问题**: Supabase 默认要求邮箱确认才能登录（"Email not confirmed"）
- **解决方案**: 通过 Management API 设置 mailer_autoconfirm=true，开发环境免邮箱验证
- **架构变化**: 新增 src/app/api/auth/login/ 路由、src/components/auth/login-form.tsx
- **待办**: 生产部署前需要重新开启邮箱确认

### 2026-04-29 — Step 9: 实现认证中间件
- **做了什么**:
  - 更新 middleware 路由保护：未登录→/login，已登录访问 auth 页→/dashboard
  - 创建登出 API (POST /api/auth/logout)
  - 创建侧边栏组件（仪表盘、知识库、对话导航 + 退出按钮）
  - 更新 dashboard 布局（侧边栏 + 主内容区 flex 布局）
  - Dashboard 页面改为服务端组件，显示用户邮箱和欢迎卡片
  - 测试：未登录→307→/login、已登录→200、已登录访问/login→307→/dashboard、登出成功
- **遇到的问题**: 无
- **解决方案**: N/A
- **架构变化**: src/lib/supabase/middleware.ts 增加路由保护、新增 Sidebar 组件
- **待办**: 无

### 2026-04-29 — Step 10: 仪表盘页面（知识库管理）
- **做了什么**:
  - 创建知识库 CRUD API（GET/POST /api/knowledge-base, DELETE /api/knowledge-base/[id]）
  - 用户数据隔离（所有查询加 user_id 过滤）
  - 输入验证：名称必填、长度≤50、描述≤200、XSS 防护（trim/slice）
  - 删除前验证所有权
  - 创建 CreateKnowledgeBaseDialog 组件（弹窗表单）
  - 创建 KnowledgeBaseList 组件（卡片网格 + 空状态 + 删除确认）
  - Dashboard 页面集成知识库列表
  - 测试：空列表→[]、创建→成功、重复→2条、删除→剩1条、名称为空→MISSING_NAME
- **遇到的问题**: 无
- **解决方案**: N/A
- **架构变化**: 新增 src/app/api/knowledge-base/ 路由、src/components/knowledge-base/ 目录
- **待办**: 无

### 2026-04-29 — Step 11: 知识库详情页
- **做了什么**:
  - 创建文档列表 API（GET /api/documents?knowledgeBaseId=, DELETE /api/documents/[id]）
  - 创建 DocumentList 组件（文档卡片、状态标签、大小格式化、错误展示、删除确认）
  - 创建 UploadButton 组件（文件选择 + 前端验证：类型限制 PDF/TXT/MD、大小≤10MB）
  - 创建 DetailContent 客户端包装组件（上传成功刷新列表）
  - 知识库详情页：服务端获取知识库信息 + 面包屑导航 + 客户端文档列表
  - 测试：空列表→[]、缺少参数→MISSING_PARAM、详情页→200、不存在→307→/dashboard
- **遇到的问题**: 服务端组件无法直接传递回调函数给客户端组件
- **解决方案**: 创建 DetailContent 客户端包装组件，内部调用 router.refresh()
- **架构变化**: 新增 src/app/api/documents/ 路由、detail-content.tsx、document-list.tsx、upload-button.tsx
- **待办**: 无（已完成）

### 2026-04-29 — Step 12: 文档上传 API
- **做了什么**:
  - 创建 POST /api/documents/upload 路由（FormData 接收 file + knowledgeBaseId）
  - 服务端验证：登录状态、文件类型（PDF/TXT/MD）、大小≤10MB、知识库所有权
  - 上传到 Supabase Storage（documents bucket），路径: {userId}/{kbId}/{timestamp}_{filename}
  - 数据库创建文档记录（status=pending，等待后续处理管道）
  - 失败时回滚已上传的 Storage 文件
  - 通过 Management API 创建 Storage bucket（documents，10MB 限制）
  - 创建 Storage RLS 策略（用户只能操作自己目录下的文件：INSERT/SELECT/DELETE）
  - 测试：上传 TXT→成功（56B）、无文件→MISSING_FILE、无 KB ID→MISSING_PARAM、.exe→INVALID_TYPE
- **遇到的问题**: Management Token 不能直接用于 Storage API，curl 传递多行 SQL 有转义问题
- **解决方案**: 通过 Management SQL API 端点执行 SQL 创建 bucket 和 RLS 策略，用文件传递 SQL 避免转义
- **架构变化**: 新增 src/app/api/documents/upload/ 路由、Supabase Storage bucket + RLS
- **待办**: 后续需要实现文档处理管道（分块 + 向量化）来将 pending 文档变为 ready

### 2026-04-29 — Step 13: 文档处理管道
- **做了什么**:
  - 创建 src/lib/document.ts（文本提取 + 清洗 + 分块）
    - PDF: pdf-parse v2 的 PDFParse API（new PDFParse + getText）
    - TXT/MD: Buffer.toString
    - 清洗：统一换行符、合并空行、去特殊字符
    - 分块：500字/块、50字重叠、优先句子边界切分
  - 创建 src/lib/ai.ts（Embedding 模块）
    - 使用 Vercel AI SDK + @ai-sdk/openai
    - 支持 OPENAI_BASE_URL（兼容 DeepSeek 等兼容 API）
    - 批量 Embedding（每批最多 100 条）
  - 创建 POST /api/documents/process 处理管道
    - 完整流程：下载→提取→清洗→分块→Embedding→写入 document_chunks
    - 状态流转：pending → processing → ready/error
    - 每步失败都记录错误信息
  - 更新 UploadButton：上传成功后自动调用 /api/documents/process
  - 测试：TXT 处理流程正确走到 Embedding 步骤（因无 API Key 报错，符合预期）
- **遇到的问题**: pdf-parse v2 没有默认导出，使用 named export { PDFParse }；构造函数需要 LoadParameters
- **解决方案**: import { PDFParse } from "pdf-parse"，new PDFParse({ data: Uint8Array }) + getText()
- **架构变化**: 新增 src/lib/document.ts、src/lib/ai.ts、src/app/api/documents/process/ 路由
- **待办**: 需要配置 OPENAI_API_KEY 后 Embedding 才能工作

### 2026-04-29 — Step 13 补充: 配置双 API 架构
- **做了什么**:
  - 配置阿里百炼 Embedding 服务（EMBEDDING_API_KEY + EMBEDDING_BASE_URL + EMBEDDING_MODEL）
  - 配置 DeepSeek Chat 服务（OPENAI_API_KEY + OPENAI_BASE_URL）
  - 重写 src/lib/ai.ts：Embedding 用 fetch 直调阿里百炼 API（绕过 AI SDK 不支持 dimensions 参数的限制），Chat 用 AI SDK
  - 数据库 document_chunks 表向量维度从 vector(1536) 调整为 vector(1024)（阿里百炼 text-embedding-v3 最大支持 1024 维）
  - 更新 Drizzle Schema 定义中的维度为 1024
  - 完整端到端测试：上传 test-ai-content.md → 文本提取 → 分块(2块) → Embedding 向量化 → 存入数据库 → 状态变为 ready
- **遇到的问题**:
  - DeepSeek 不提供 Embedding API
  - 阿里百炼 text-embedding-v3 不支持 1536 维（只支持 64/128/256/512/768/1024）
  - @ai-sdk/openai 的 embedding() 函数只接受 modelId 一个参数，不支持传 dimensions
- **解决方案**:
  - Embedding 和 Chat 分离为不同 API 提供商
  - 数据库维度改为 1024
  - Embedding 改用 fetch 直调 API，手动传 dimensions 参数
- **架构变化**: .env.local 新增 EMBEDDING_API_KEY/BASE_URL/MODEL，ai.ts 改为双 API 架构
- **Git 提交**: 370267b

### 2026-04-29 — Step 14: 语义检索 + RAG 流式问答
- **做了什么**:
  - 创建 src/lib/rag.ts（RAG 核心模块）
    - searchSimilarChunks: 通过 Supabase RPC 函数 match_documents 做向量相似度搜索
    - buildRAGPrompt: 将检索到的文档片段组装成 RAG 上下文
    - extractSources: 从搜索结果提取引用来源
    - SYSTEM_PROMPT: 知识库问答助手的系统提示词
  - 在 Supabase 创建 match_documents RPC 函数（余弦距离向量搜索，支持过滤 knowledge_base_id 和 user_id）
  - 创建对话 CRUD API：GET/POST /api/chat（列表/创建）、GET /api/chat/messages（历史消息）
  - 创建流式问答 API：POST /api/chat/message
    - 完整流程：验证对话所有权 → 保存用户消息 → RAG 语义检索 → 构建上下文 → 流式调用 DeepSeek → 保存 AI 回答
    - SSE 流式格式：data: {"text":"..."} + data: {"done":true,"sources":[...]}
  - 创建 3 个聊天组件：
    - ChatContainer: 管理对话状态、SSE 流式解析、自动滚动
    - ChatInput: 输入框 + 发送按钮 + Ctrl+Enter 快捷键
    - MessageList: 消息气泡 + 来源引用 + 打字动画效果
  - 更新知识库详情页：添加"开始对话"按钮
  - 更新对话页面：服务端获取对话信息 + 客户端聊天交互
  - 修复 @ai-sdk/openai v3.x 兼容性问题：
    - v3 默认使用 OpenAI Responses API（/responses），DeepSeek 不支持返回 404
    - 解决方案：使用 client.chat() 方法强制走 Chat Completions API（/chat/completions）
  - 端到端测试全部通过：
    - 创建对话 → 成功
    - 单轮问答 "请详细解释RAG的工作原理" → AI 基于知识库精准回答 + 引用来源
    - 多轮对话 "向量数据库在哪些场景中使用" → 正确理解上下文并回答
    - 流式输出 240 行 SSE 数据，文字流畅
    - 消息历史 API 正常返回（含 sources）
    - 页面渲染：/dashboard 200、/chat/[id] 200、/knowledge-base/[id] 200
- **遇到的问题**:
  - @ai-sdk/openai v3.x 默认使用 Responses API 而非 Chat Completions API
  - DeepSeek 不支持 /responses 端点，返回 404
  - streamText 返回空文本但 sources 正常
- **解决方案**:
  - 将 client(model) 改为 client.chat(model)，强制走 /chat/completions 端点
- **架构变化**: 新增 src/lib/rag.ts、src/app/api/chat/（3 个路由）、src/components/chat/（3 个组件）
- **Git 提交**: 247ade2

### 2026-04-29 — Step 15: 完善对话界面 UI
- **做了什么**:
  - 安装 react-markdown + remark-gfm 依赖
  - 重写 MessageList 组件：
    - AI 回答支持 Markdown 渲染（加粗、列表、代码块、标题等）
    - 引用来源改为可折叠卡片（SourceCard），显示文档名 + 片段预览
    - 空状态优化：添加 emoji 图标 + 推荐提问提示
    - 消息气泡圆角优化（用户 br-md / AI bl-md）
  - 创建 ConversationList 组件：
    - 显示所有对话列表，高亮当前活跃对话
    - 相对时间显示（刚刚/X分钟前/X小时前/X天前）
    - 加载骨架屏动画
  - 创建 /chat 页面（对话列表入口）：
    - 左侧对话列表 + 右侧空状态提示
    - 底部"从知识库开始新对话"按钮
  - 增强 ChatContainer：
    - 可收起/展开的对话历史侧边栏
    - 顶部栏包含知识库名称、侧边栏切换、返回仪表盘
    - 加载状态优化（打字动画指示器）
  - 所有 19 个路由正常，构建通过
- **遇到的问题**: 无
- **解决方案**: N/A
- **架构变化**: 新增 /chat 页面路由、ConversationList 组件、Markdown 渲染
- **Git 提交**: bc91f97

### 2026-04-29 — Step 16: 错误处理 + 加载状态 + Toast 通知
- **做了什么**:
  - 安装 Sonner toast 库，集成到根布局（顶部居中、彩色图标、关闭按钮）
  - 为 6 个交互组件添加 toast 通知：
    - KnowledgeBaseList: 加载失败/删除成功/删除失败
    - UploadButton: 文件类型错误/文件过大/上传成功/处理完成/处理未完成
    - ChatContainer: 加载失败/发送失败
    - ConversationList: 加载失败
    - RegisterForm: 注册成功/注册失败/网络错误
    - LoginForm: 登录成功/登录失败/网络错误
  - 创建 loading.tsx 骨架屏：
    - Dashboard: 标题骨架 + 3 个卡片骨架（animate-pulse）
    - Auth: 弹跳动画 + 文字提示
  - 创建 error.tsx 错误边界：
    - 全局 error.tsx: emoji + 错误信息 + 重试/返回首页
    - Dashboard error.tsx: 同上风格
  - 创建 not-found.tsx 404 页面：大号 404 + 文字说明 + 导航按钮
  - 移除所有 alert() 调用，统一使用 toast
  - 测试：所有页面 200、已登录重定向 307、不存在路径 404
- **遇到的问题**: 无
- **解决方案**: N/A
- **架构变化**: 新增 sonner 依赖、3 个 error/loading/not-found 页面
- **Git 提交**: 9e8f244
