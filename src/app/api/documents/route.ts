import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/documents?knowledgeBaseId=xxx — 获取知识库下的文档列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const knowledgeBaseId = searchParams.get("knowledgeBaseId");

    if (!knowledgeBaseId) {
      return NextResponse.json(
        { error: "缺少 knowledgeBaseId 参数", code: "MISSING_PARAM" },
        { status: 400 }
      );
    }

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

    // 验证知识库属于当前用户
    const { data: kb } = await supabase
      .from("knowledge_bases")
      .select("id, name")
      .eq("id", knowledgeBaseId)
      .eq("user_id", user.id)
      .single();

    if (!kb) {
      return NextResponse.json(
        { error: "知识库不存在或无权访问", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("documents")
      .select("id, name, type, size_bytes, status, error_message, created_at, updated_at")
      .eq("knowledge_base_id", knowledgeBaseId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "获取文档列表失败", code: "QUERY_FAILED" },
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
