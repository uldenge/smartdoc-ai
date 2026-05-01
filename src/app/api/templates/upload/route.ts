import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseTemplateMarkdown } from "@/lib/doc-gen/template-parser";

const MAX_FILE_SIZE = 100 * 1024; // 100KB

// POST /api/templates/upload — 上传 Markdown 文件作为自定义模板
export async function POST(request: NextRequest) {
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

  // 解析 FormData
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "请选择文件", code: "MISSING_FILE" },
      { status: 400 }
    );
  }

  // 验证文件类型
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith(".md") && !fileName.endsWith(".markdown")) {
    return NextResponse.json(
      { error: "仅支持 .md 或 .markdown 格式的文件", code: "INVALID_TYPE" },
      { status: 400 }
    );
  }

  // 验证文件大小
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "文件大小不能超过 100KB", code: "FILE_TOO_LARGE" },
      { status: 400 }
    );
  }

  // 读取文件内容
  const content = await file.text();

  // 解析 Markdown 模板
  const result = parseTemplateMarkdown(content);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        error: "模板解析失败",
        code: "PARSE_ERROR",
        details: result.errors,
      },
      { status: 400 }
    );
  }

  // 插入数据库
  const { data, error } = await supabase
    .from("doc_templates")
    .insert({
      user_id: user.id,
      name: result.data.name,
      description: result.data.description || null,
      category: result.data.category,
      is_system: false,
      sections: result.data.sections,
      variables: result.data.variables,
    })
    .select(
      "id, name, description, category, is_system, sections, variables, created_at, updated_at"
    )
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message, code: "DB_ERROR" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data, error: null });
}
