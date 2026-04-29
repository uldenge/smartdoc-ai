import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/chat — 获取当前用户的对话列表
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "未登录", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, knowledge_base_id, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "获取对话列表失败", code: "QUERY_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, error: null });
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// POST /api/chat — 创建新对话
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "未登录", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { knowledgeBaseId } = body;

    if (!knowledgeBaseId) {
      return NextResponse.json(
        { error: "缺少 knowledgeBaseId", code: "MISSING_PARAM" },
        { status: 400 }
      );
    }

    // 验证知识库所有权
    const { data: kb } = await supabase
      .from("knowledge_bases")
      .select("id, name")
      .eq("id", knowledgeBaseId)
      .eq("user_id", user.id)
      .single();

    if (!kb) {
      return NextResponse.json(
        { error: "知识库不存在或无权操作", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        knowledge_base_id: knowledgeBaseId,
        title: `关于「${kb.name}」的对话`,
      })
      .select("id, title, knowledge_base_id, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "创建对话失败", code: "INSERT_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, error: null });
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
