import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchSimilarChunks, buildRAGPrompt, extractSources } from "@/lib/rag";
import { streamChat } from "@/lib/ai";
import { resolveVariables, assembleFullDocument } from "@/lib/doc-gen/template-engine";
import { buildSectionSystemPrompt, buildSectionUserPrompt } from "@/lib/doc-gen/generation-prompt";
import type { TemplateSection, SectionContent } from "@/types";

// POST /api/doc-gen/[id]/generate — 逐章节流式生成文档
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未登录", code: "UNAUTHORIZED" }, { status: 401 });
  }

  // 获取生成文档
  const { data: doc } = await supabase
    .from("generated_documents")
    .select("id, user_id, status, template_id, knowledge_base_ids, variables")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!doc) {
    return NextResponse.json({ error: "文档不存在", code: "NOT_FOUND" }, { status: 404 });
  }

  if (doc.status === "generating") {
    return NextResponse.json({ error: "文档正在生成中", code: "ALREADY_GENERATING" }, { status: 409 });
  }

  const kbIds = (doc.knowledge_base_ids as string[]) || [];
  if (kbIds.length === 0) {
    return NextResponse.json({ error: "请先关联知识库", code: "MISSING_KB" }, { status: 400 });
  }

  // 获取模板章节定义
  const { data: template } = await supabase
    .from("doc_templates")
    .select("sections")
    .eq("id", doc.template_id)
    .single();

  if (!template?.sections) {
    return NextResponse.json({ error: "模板数据异常", code: "TEMPLATE_ERROR" }, { status: 500 });
  }

  const sections = template.sections as TemplateSection[];
  const variables = (doc.variables as Record<string, string>) || {};

  // 更新状态为 generating
  await supabase
    .from("generated_documents")
    .update({ status: "generating", error_message: null, sections_content: [], updated_at: new Date().toISOString() })
    .eq("id", id);

  const encoder = new TextEncoder();
  const sectionsContent: SectionContent[] = [];

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          send({ event: "section_start", sectionId: section.id, title: section.title, index: i, total: sections.length });

          // 1. 替换 prompt_hint 中的变量
          const resolvedHint = resolveVariables(section.prompt_hint, variables);

          // 2. RAG 检索相关内容
          let ragContext = "";
          let sources: Awaited<ReturnType<typeof extractSources>> = [];
          try {
            const searchResults = await searchSimilarChunks(resolvedHint, kbIds, user.id, 8);
            ragContext = buildRAGPrompt(searchResults);
            sources = extractSources(searchResults);
          } catch {
            // RAG 检索失败不阻塞生成
            ragContext = "（参考资料检索失败，请基于专业知识撰写）";
          }

          // 3. 构建 Prompt
          const systemPrompt = buildSectionSystemPrompt(section.title, section.description);
          const userPrompt = buildSectionUserPrompt(resolvedHint, ragContext);

          // 4. 流式生成
          let sectionContent = "";
          const result = streamChat([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ]);

          for await (const chunk of result.textStream) {
            sectionContent += chunk;
            send({ event: "section_chunk", sectionId: section.id, text: chunk });
          }

          // 5. 保存章节结果
          const sectionResult: SectionContent = {
            sectionId: section.id,
            title: section.title,
            content: sectionContent,
            sources,
            status: "completed",
          };
          sectionsContent.push(sectionResult);

          // 更新数据库中的进度
          await supabase
            .from("generated_documents")
            .update({
              sections_content: sectionsContent,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id);

          send({ event: "section_done", sectionId: section.id, sources });
        }

        // 6. 组装完整文档
        const fullContent = assembleFullDocument(sectionsContent, variables);

        await supabase
          .from("generated_documents")
          .update({
            status: "completed",
            full_content: fullContent,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        send({ event: "done" });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "生成失败";

        await supabase
          .from("generated_documents")
          .update({
            status: "error",
            error_message: errorMessage,
            sections_content: sectionsContent,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        send({ event: "error", message: errorMessage });
      } finally {
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
}
