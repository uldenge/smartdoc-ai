import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/chat/messages?conversationId=xxx — 获取对话历史消息
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "缺少 conversationId", code: "MISSING_PARAM" },
        { status: 400 }
      );
    }

    // 验证对话所有权
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: "对话不存在或无权操作", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("messages")
      .select("id, role, content, sources, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "获取消息失败", code: "QUERY_FAILED" },
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
