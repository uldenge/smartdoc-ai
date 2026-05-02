import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/templates/[id] — 获取单个模板详情
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
    .from("doc_templates")
    .select("id, name, description, category, is_system, sections, variables, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "模板不存在", code: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ data, error: null });
}

// PUT /api/templates/[id] — 更新自定义模板
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

  if (body.name !== undefined) updates.name = body.name.trim().slice(0, 100);
  if (body.description !== undefined) updates.description = body.description?.trim()?.slice(0, 500) || null;
  if (body.category !== undefined) updates.category = body.category;
  if (body.sections !== undefined) updates.sections = body.sections;
  if (body.variables !== undefined) updates.variables = body.variables;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("doc_templates")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("is_system", false)
    .select("id, name, description, category, is_system, sections, variables, created_at, updated_at");

  if (error) {
    return NextResponse.json({ error: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "无法更新此模板（系统模板或无权限）", code: "FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json({ data: data[0], error: null });
}

// DELETE /api/templates/[id] — 删除自定义模板
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

  const { error, count } = await supabase
    .from("doc_templates")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("is_system", false);

  if (error) {
    return NextResponse.json({ error: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  if (!count || count === 0) {
    return NextResponse.json({ error: "无法删除此模板（系统模板或无权限）", code: "FORBIDDEN" }, { status: 403 });
  }

  return NextResponse.json({ data: { message: "删除成功" }, error: null });
}
