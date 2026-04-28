# SmartDoc AI — 开发进度记录

> 每完成一个步骤，在这里记录做了什么、遇到的问题、解决方案。供 AI 后续开发参考。

---

## 当前状态
- **当前阶段**: 阶段 A — 环境搭建与项目骨架
- **当前步骤**: Step 5 — 建立数据库 Schema
- **已完成步骤**: Step 1, Step 2, Step 3, Step 4
- **下一步行动**: 使用 Drizzle ORM 定义表结构并运行迁移

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
