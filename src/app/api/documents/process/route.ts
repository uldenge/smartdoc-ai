import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { extractText, cleanText, splitText } from "@/lib/document";
import { generateEmbeddings } from "@/lib/ai";

// POST /api/documents/process — 处理单个 pending 文档
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

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "缺少 documentId", code: "MISSING_PARAM" },
        { status: 400 }
      );
    }

    // 获取文档记录并验证所有权
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, name, type, storage_path, status, user_id, knowledge_base_id")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "文档不存在或无权操作", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    if (doc.status === "processing" || doc.status === "ready") {
      return NextResponse.json(
        { error: `文档状态为 ${doc.status}，无法重复处理`, code: "INVALID_STATE" },
        { status: 400 }
      );
    }

    // 更新状态为 processing
    await supabase
      .from("documents")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", doc.id);

    // Step 1: 从 Storage 下载文件
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(doc.storage_path);

    if (downloadError || !fileData) {
      await updateDocError(supabase, doc.id, "文件下载失败");
      return NextResponse.json(
        { error: "文件下载失败", code: "DOWNLOAD_FAILED" },
        { status: 500 }
      );
    }

    // Step 2: 提取文本
    let rawText: string;
    try {
      const buffer = Buffer.from(await fileData.arrayBuffer());
      rawText = await extractText(buffer, doc.type);
    } catch (e) {
      const message = e instanceof Error ? e.message : "文本提取失败";
      await updateDocError(supabase, doc.id, message);
      return NextResponse.json(
        { error: message, code: "EXTRACT_FAILED" },
        { status: 500 }
      );
    }

    // Step 3: 清洗 + 分块
    const cleaned = cleanText(rawText);
    const chunks = splitText(cleaned);

    if (chunks.length === 0) {
      await updateDocError(supabase, doc.id, "文档内容为空");
      return NextResponse.json(
        { error: "文档内容为空", code: "EMPTY_CONTENT" },
        { status: 400 }
      );
    }

    // Step 4: 生成 Embedding
    let embeddings: number[][];
    try {
      embeddings = await generateEmbeddings(chunks.map((c) => c.content));
    } catch (e) {
      const message = e instanceof Error ? e.message : "向量化失败";
      await updateDocError(supabase, doc.id, message);
      return NextResponse.json(
        { error: message, code: "EMBEDDING_FAILED" },
        { status: 500 }
      );
    }

    // Step 5: 写入 document_chunks 表
    const chunkRecords = chunks.map((chunk, i) => ({
      document_id: doc.id,
      knowledge_base_id: doc.knowledge_base_id,
      user_id: user.id,
      content: chunk.content,
      metadata: { position: chunk.metadata.position },
      embedding: `[${embeddings[i].join(",")}]`,
    }));

    const { error: insertError } = await supabase
      .from("document_chunks")
      .insert(chunkRecords);

    if (insertError) {
      await updateDocError(supabase, doc.id, `片段存储失败: ${insertError.message}`);
      return NextResponse.json(
        { error: "片段存储失败", code: "CHUNK_INSERT_FAILED" },
        { status: 500 }
      );
    }

    // Step 6: 更新文档状态为 ready
    await supabase
      .from("documents")
      .update({
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", doc.id);

    return NextResponse.json({
      data: {
        documentId: doc.id,
        chunksCount: chunks.length,
        status: "ready",
      },
      error: null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "服务器内部错误";
    return NextResponse.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

async function updateDocError(
  supabase: Awaited<ReturnType<typeof createClient>>,
  docId: string,
  errorMessage: string
) {
  await supabase
    .from("documents")
    .update({
      status: "error",
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", docId);
}
