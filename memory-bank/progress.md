# SmartDoc AI — 开发进度记录

> 每完成一个步骤，在这里记录做了什么、遇到的问题、解决方案。供 AI 后续开发参考。

---

## 当前状态
- **当前阶段**: 阶段 B — 用户认证
- **当前步骤**: Step 8 — 实现登录页面
- **已完成步骤**: Step 1, Step 2, Step 3, Step 4, Step 5, Step 6, Step 7
- **下一步行动**: 实现登录页面（邮箱+密码登录，成功跳转 dashboard）

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
