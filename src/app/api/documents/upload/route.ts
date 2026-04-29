import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ALLOWED_EXTENSIONS = ["pdf", "txt", "md"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
];

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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const knowledgeBaseId = formData.get("knowledgeBaseId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "请选择文件", code: "MISSING_FILE" },
        { status: 400 }
      );
    }

    if (!knowledgeBaseId) {
      return NextResponse.json(
        { error: "缺少知识库 ID", code: "MISSING_PARAM" },
        { status: 400 }
      );
    }

    // 验证知识库属于当前用户
    const { data: kb } = await supabase
      .from("knowledge_bases")
      .select("id")
      .eq("id", knowledgeBaseId)
      .eq("user_id", user.id)
      .single();

    if (!kb) {
      return NextResponse.json(
        { error: "知识库不存在或无权操作", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // 验证文件类型
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: "仅支持 PDF、TXT、Markdown 文件", code: "INVALID_TYPE" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "文件大小不能超过 10MB", code: "FILE_TOO_LARGE" },
        { status: 400 }
      );
    }

    // 生成唯一存储路径: {userId}/{knowledgeBaseId}/{timestamp}_{filename}
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${user.id}/${knowledgeBaseId}/${timestamp}_${sanitizedName}`;

    // 上传到 Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, fileBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `文件上传失败: ${uploadError.message}`, code: "UPLOAD_FAILED" },
        { status: 500 }
      );
    }

    // 在 documents 表中创建记录（status=pending，等待后续处理）
    const { data: doc, error: dbError } = await supabase
      .from("documents")
      .insert({
        knowledge_base_id: knowledgeBaseId,
        user_id: user.id,
        name: file.name.trim(),
        type: ext,
        storage_path: storagePath,
        size_bytes: file.size,
        status: "pending",
      })
      .select("id, name, type, size_bytes, status, created_at")
      .single();

    if (dbError) {
      // 回滚：删除已上传的文件
      await supabase.storage.from("documents").remove([storagePath]);
      return NextResponse.json(
        { error: "创建文档记录失败", code: "DB_INSERT_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: doc, error: null }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
