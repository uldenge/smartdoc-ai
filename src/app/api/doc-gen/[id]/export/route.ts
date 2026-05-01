import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/doc-gen/[id]/export — 导出文档
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未登录", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { format } = await request.json();

  const { data: doc } = await supabase
    .from("generated_documents")
    .select("id, title, full_content")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!doc?.full_content) {
    return NextResponse.json({ error: "文档内容为空或未生成", code: "NO_CONTENT" }, { status: 400 });
  }

  const filename = doc.title.replace(/[^\w一-鿿]/g, "_").slice(0, 50);

  if (format === "markdown" || format === "md") {
    return new NextResponse(doc.full_content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}.md"`,
      },
    });
  }

  return NextResponse.json({ error: "不支持的导出格式", code: "INVALID_FORMAT" }, { status: 400 });
}
