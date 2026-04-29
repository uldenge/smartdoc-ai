# SmartDoc AI — 开发进度记录

> 每完成一个步骤，在这里记录做了什么、遇到的问题、解决方案。供 AI 后续开发参考。

---

## 当前状态
- **当前阶段**: 阶段 B — 用户认证
- **当前步骤**: Step 13 — 文档处理（分块 + 向量化）
- **已完成步骤**: Step 1 ~ Step 12
- **下一步行动**: 实现文档处理管道（PDF 解析、文本分块、Embedding 向量化）

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
