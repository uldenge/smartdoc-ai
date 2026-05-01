import type { TemplateCategory, TemplateSection, TemplateVariable } from "@/types";

interface SystemTemplateData {
  name: string;
  description: string;
  category: TemplateCategory;
  sections: TemplateSection[];
  variables: TemplateVariable[];
}

/**
 * 返回 3 个内置系统模板定义
 * 这些模板在数据库初始化时通过 SQL API 插入
 */
export function getSystemTemplates(): SystemTemplateData[] {
  return [
    {
      name: "技术方案模板",
      description: "适用于项目技术方案的撰写，包含项目概述、需求分析、技术架构、数据库设计、接口设计、部署方案、风险评估等章节",
      category: "technical",
      sections: [
        { id: "s1", title: "项目概述", description: "简要介绍项目背景、目标和范围", prompt_hint: "请介绍项目 {{project_name}} 的背景、主要目标和整体范围", required: true },
        { id: "s2", title: "需求分析", description: "详细描述功能需求和非功能需求", prompt_hint: "请详细分析 {{project_name}} 的功能需求和非功能需求", required: true },
        { id: "s3", title: "技术架构设计", description: "描述系统的整体技术架构和技术选型", prompt_hint: "请描述 {{project_name}} 的技术架构设计，包括 {{tech_stack}} 相关的设计", required: true },
        { id: "s4", title: "数据库设计", description: "描述数据模型和数据库表结构", prompt_hint: "请描述 {{project_name}} 的数据库设计，包括核心数据模型和表结构", required: true },
        { id: "s5", title: "接口设计", description: "描述系统对外提供的 API 接口", prompt_hint: "请描述 {{project_name}} 的接口设计，包括核心 API 端点和数据格式", required: false },
        { id: "s6", title: "部署方案", description: "描述系统的部署架构和运维策略", prompt_hint: "请描述 {{project_name}} 的部署方案，包括环境配置、CI/CD、监控等", required: false },
        { id: "s7", title: "风险评估", description: "识别项目潜在风险并提出应对措施", prompt_hint: "请识别 {{project_name}} 的潜在风险，并提出相应的应对措施", required: false },
      ],
      variables: [
        { name: "project_name", label: "项目名称", type: "text", required: true },
        { name: "tech_stack", label: "技术栈", type: "text", required: false },
        { name: "version", label: "文档版本", type: "text", required: false, default: "1.0" },
      ],
    },
    {
      name: "需求分析报告模板",
      description: "适用于软件项目的需求分析报告，包含项目背景、功能需求、非功能需求、用户角色、用例描述、优先级排序等章节",
      category: "requirement",
      sections: [
        { id: "s1", title: "项目背景", description: "描述项目的商业背景和发起原因", prompt_hint: "请描述 {{project_name}} 项目的商业背景和发起原因", required: true },
        { id: "s2", title: "功能需求", description: "详细列出系统的功能需求", prompt_hint: "请详细列出 {{project_name}} 的功能需求，按模块分类", required: true },
        { id: "s3", title: "非功能需求", description: "描述性能、安全、可用性等非功能性需求", prompt_hint: "请描述 {{project_name}} 的非功能需求，包括性能、安全、可用性等", required: true },
        { id: "s4", title: "用户角色分析", description: "识别系统的目标用户和角色", prompt_hint: "请识别并分析 {{project_name}} 的用户角色和使用场景", required: true },
        { id: "s5", title: "用例描述", description: "描述核心用例的交互流程", prompt_hint: "请描述 {{project_name}} 的核心用例及其交互流程", required: false },
        { id: "s6", title: "优先级排序", description: "对需求进行优先级排序和分期规划", prompt_hint: "请对 {{project_name}} 的需求进行优先级排序，并规划分期实施方案", required: false },
      ],
      variables: [
        { name: "project_name", label: "项目名称", type: "text", required: true },
        { name: "target_users", label: "目标用户", type: "text", required: false },
      ],
    },
    {
      name: "系统设计文档模板",
      description: "适用于系统设计文档的撰写，包含设计目标、系统架构、模块设计、数据模型、安全设计、性能设计等章节",
      category: "design",
      sections: [
        { id: "s1", title: "设计目标", description: "明确系统设计的总体目标和约束条件", prompt_hint: "请明确 {{project_name}} 的设计目标和约束条件", required: true },
        { id: "s2", title: "系统架构", description: "描述系统的整体架构", prompt_hint: "请描述 {{project_name}} 的系统整体架构，包括分层设计和组件关系", required: true },
        { id: "s3", title: "模块设计", description: "描述核心模块的详细设计", prompt_hint: "请描述 {{project_name}} 的核心模块设计，包括职责划分和交互方式", required: true },
        { id: "s4", title: "数据模型", description: "描述系统的数据模型设计", prompt_hint: "请描述 {{project_name}} 的数据模型设计，包括实体关系和数据流转", required: true },
        { id: "s5", title: "安全设计", description: "描述系统的安全策略和认证授权方案", prompt_hint: "请描述 {{project_name}} 的安全设计，包括认证、授权和数据保护", required: false },
        { id: "s6", title: "性能设计", description: "描述系统的性能优化策略", prompt_hint: "请描述 {{project_name}} 的性能设计，包括缓存策略、并发处理等", required: false },
      ],
      variables: [
        { name: "project_name", label: "项目名称", type: "text", required: true },
        { name: "architecture_style", label: "架构风格", type: "text", required: false, default: "微服务" },
        { name: "version", label: "文档版本", type: "text", required: false, default: "1.0" },
      ],
    },
  ];
}
