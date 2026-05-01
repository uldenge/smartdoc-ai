import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/templates — 获取模板列表（系统模板 + 用户自定义模板）
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未登录", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("doc_templates")
    .select("id, name, description, category, is_system, sections, variables, created_at, updated_at")
    .order("is_system", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}

// POST /api/templates — 创建自定义模板
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未登录", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, category, sections, variables } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "模板名称不能为空", code: "MISSING_NAME" }, { status: 400 });
  }

  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return NextResponse.json({ error: "至少需要定义一个章节", code: "MISSING_SECTIONS" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("doc_templates")
    .insert({
      user_id: user.id,
      name: name.trim().slice(0, 100),
      description: description?.trim()?.slice(0, 500) || null,
      category: category || "general",
      is_system: false,
      sections,
      variables: variables || [],
    })
    .select("id, name, description, category, is_system, sections, variables, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ data, error: null });
}
