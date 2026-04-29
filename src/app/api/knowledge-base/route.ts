import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/knowledge-base — 获取当前用户的知识库列表
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
      .from("knowledge_bases")
      .select("id, name, description, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "获取知识库列表失败", code: "QUERY_FAILED" },
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

// POST /api/knowledge-base — 创建新知识库
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
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "知识库名称不能为空", code: "MISSING_NAME" },
        { status: 400 }
      );
    }

    if (name.trim().length > 50) {
      return NextResponse.json(
        { error: "知识库名称不能超过 50 个字符", code: "NAME_TOO_LONG" },
        { status: 400 }
      );
    }

    const sanitizedDescription =
      description && typeof description === "string"
        ? description.trim().slice(0, 200)
        : null;

    const { data, error } = await supabase
      .from("knowledge_bases")
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: sanitizedDescription,
      })
      .select("id, name, description, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "创建知识库失败", code: "INSERT_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, error: null }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
