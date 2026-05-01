import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/doc-gen/[id] — 获取生成文档详情
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未登录", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("generated_documents")
    .select("id, title, status, template_id, knowledge_base_id, variables, sections_content, full_content, error_message, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "文档不存在", code: "NOT_FOUND" }, { status: 404 });
  }

  // 获取模板信息
  const { data: template } = await supabase
    .from("doc_templates")
    .select("id, name, sections, variables")
    .eq("id", data.template_id)
    .single();

  return NextResponse.json({ data: { ...data, template }, error: null });
}

// PUT /api/doc-gen/[id] — 更新文档（编辑章节内容）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未登录", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) updates.title = body.title.trim().slice(0, 200);
  if (body.sections_content !== undefined) updates.sections_content = body.sections_content;
  if (body.full_content !== undefined) updates.full_content = body.full_content;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("generated_documents")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, title, status, sections_content, full_content")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "文档不存在", code: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ data, error: null });
}

// DELETE /api/doc-gen/[id] — 删除生成文档
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未登录", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { error } = await supabase
    .from("generated_documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ data: { message: "删除成功" }, error: null });
}
