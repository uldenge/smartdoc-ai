import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/doc-gen — 获取用户生成的文档列表
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未登录", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("generated_documents")
    .select("id, title, status, template_id, knowledge_base_ids, variables, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  // 同时获取模板名称和知识库名称
  if (data && data.length > 0) {
    const templateIds = [...new Set(data.map(d => d.template_id))];
    const { data: templates } = await supabase
      .from("doc_templates")
      .select("id, name")
      .in("id", templateIds);

    const templateMap = new Map(templates?.map(t => [t.id, t.name]) || []);

    // 获取所有关联的知识库名称
    const allKbIds = data.flatMap(d => d.knowledge_base_ids || []);
    const uniqueKbIds = [...new Set(allKbIds)];
    const { data: kbs } = uniqueKbIds.length > 0
      ? await supabase.from("knowledge_bases").select("id, name").in("id", uniqueKbIds)
      : { data: [] };
    const kbMap = new Map(kbs?.map(k => [k.id, k.name]) || []);

    const enriched = data.map(d => ({
      ...d,
      templateName: templateMap.get(d.template_id) || "未知模板",
      knowledgeBaseNames: (d.knowledge_base_ids || []).map((id: string) => kbMap.get(id) || "未知知识库"),
    }));

    return NextResponse.json({ data: enriched, error: null });
  }

  return NextResponse.json({ data: [], error: null });
}

// POST /api/doc-gen — 创建生成文档草稿（支持多个知识库）
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未登录", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json();
  const { templateId, knowledgeBaseIds, title, variables } = body;

  if (!templateId) {
    return NextResponse.json({ error: "请选择模板", code: "MISSING_TEMPLATE" }, { status: 400 });
  }

  if (!Array.isArray(knowledgeBaseIds) || knowledgeBaseIds.length === 0) {
    return NextResponse.json({ error: "请至少选择一个知识库", code: "MISSING_KB" }, { status: 400 });
  }

  if (knowledgeBaseIds.length > 10) {
    return NextResponse.json({ error: "最多选择 10 个知识库", code: "TOO_MANY_KB" }, { status: 400 });
  }

  if (!title?.trim()) {
    return NextResponse.json({ error: "请填写文档标题", code: "MISSING_TITLE" }, { status: 400 });
  }

  // 验证所有知识库的所有权
  const { data: kbs } = await supabase
    .from("knowledge_bases")
    .select("id, name")
    .in("id", knowledgeBaseIds)
    .eq("user_id", user.id);

  if (!kbs || kbs.length !== knowledgeBaseIds.length) {
    return NextResponse.json({ error: "部分知识库不存在或无权限", code: "KB_NOT_FOUND" }, { status: 404 });
  }

  // 验证模板存在
  const { data: template } = await supabase
    .from("doc_templates")
    .select("id")
    .eq("id", templateId)
    .single();

  if (!template) {
    return NextResponse.json({ error: "模板不存在", code: "TEMPLATE_NOT_FOUND" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("generated_documents")
    .insert({
      user_id: user.id,
      template_id: templateId,
      knowledge_base_ids: knowledgeBaseIds,
      title: title.trim().slice(0, 200),
      status: "draft",
      variables: variables || {},
      sections_content: [],
    })
    .select("id, title, status, template_id, knowledge_base_ids, variables, sections_content, full_content, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}
