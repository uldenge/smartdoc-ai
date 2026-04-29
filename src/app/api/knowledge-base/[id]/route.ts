import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// DELETE /api/knowledge-base/[id] — 删除知识库
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // 先验证知识库属于当前用户
    const { data: kb, error: fetchError } = await supabase
      .from("knowledge_bases")
      .select("id, name")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !kb) {
      return NextResponse.json(
        { error: "知识库不存在或无权操作", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("knowledge_bases")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "删除知识库失败", code: "DELETE_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { message: "已删除" }, error: null });
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
