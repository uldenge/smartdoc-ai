import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { searchSimilarChunks, buildRAGPrompt, extractSources, SYSTEM_PROMPT } from "@/lib/rag";
import { streamChat } from "@/lib/ai";
import type { MessageSource } from "@/types";

// POST /api/chat/message — 发送消息并获取流式 AI 回答
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
    const { conversationId, content } = body;

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: "缺少必要参数", code: "MISSING_PARAM" },
        { status: 400 }
      );
    }

    // 验证对话所有权
    const { data: conversation } = await supabase
      .from("conversations")
      .select("id, knowledge_base_id, user_id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: "对话不存在或无权操作", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // 保存用户消息
    const { error: userMsgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: "user",
        content: content.trim(),
      });

    if (userMsgError) {
      return NextResponse.json(
        { error: "保存消息失败", code: "INSERT_FAILED" },
        { status: 500 }
      );
    }

    // RAG: 语义检索相关文档片段
    let searchResults: Awaited<ReturnType<typeof searchSimilarChunks>> = [];
    let sources: MessageSource[] = [];

    try {
      searchResults = await searchSimilarChunks(
        content,
        conversation.knowledge_base_id,
        user.id,
        5
      );
      sources = extractSources(searchResults);
    } catch (e) {
      // 检索失败不阻断对话，但记录错误
      console.error("RAG 检索失败:", e instanceof Error ? e.message : "未知错误");
    }

    // 构建 RAG 上下文
    const contextPrompt = searchResults.length > 0
      ? buildRAGPrompt(searchResults)
      : "当前没有找到相关文档内容。请根据你的知识尽力回答用户问题，并说明这不是基于知识库的回答。";

    // 获取历史消息（最近 10 条）
    const { data: historyMessages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(10);

    const chatMessages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: contextPrompt },
    ];

    if (historyMessages) {
      for (const msg of historyMessages) {
        chatMessages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    // 流式调用 LLM
    const result = streamChat(chatMessages);

    // 创建流式响应
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            fullResponse += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
            );
          }

          // 保存 AI 回答到数据库
          await supabase.from("messages").insert({
            conversation_id: conversationId,
            user_id: user.id,
            role: "assistant",
            content: fullResponse,
            sources: sources.length > 0 ? sources : null,
          });

          // 更新对话的 updated_at
          await supabase
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", conversationId);

          // 发送结束标记（包含 sources）
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, sources })}\n\n`
            )
          );
          controller.close();
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : "生成回答失败";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "服务器内部错误", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
