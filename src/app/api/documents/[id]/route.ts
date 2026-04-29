import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// DELETE /api/documents/[id] — 删除文档
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

    // 查询文档并验证所有权
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("id, name, storage_path, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !doc) {
      return NextResponse.json(
        { error: "文档不存在或无权操作", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // 删除 Storage 中的文件
    if (doc.storage_path) {
      await supabase.storage.from("documents").remove([doc.storage_path]);
    }

    // 删除数据库记录（级联删除 document_chunks）
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "删除文档失败", code: "DELETE_FAILED" },
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
