"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { SectionContent, MessageSource } from "@/types";

interface GenerationViewerProps {
  docId: string;
  sections: SectionContent[];
  totalSections: number;
  fullContent: string | null;
  status: "draft" | "generating" | "completed" | "error";
  errorMessage: string | null;
  onComplete: (fullContent: string) => void;
  onError: (message: string) => void;
}

export function GenerationViewer({
  docId,
  sections: initialSections,
  totalSections,
  fullContent,
  status: initialStatus,
  errorMessage,
  onComplete,
  onError,
}: GenerationViewerProps) {
  const [sections, setSections] = useState<SectionContent[]>(initialSections);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [currentChunk, setCurrentChunk] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const currentSectionRef = useCallback(
    (sectionId: string) => {
      setActiveSection(sectionId);
    },
    []
  );

  async function startGeneration() {
    setGenerating(true);
    setSections([]);
    setCurrentChunk("");
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`/api/doc-gen/${docId}/generate`, {
        method: "POST",
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "生成失败");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("无法读取流");

      const decoder = new TextDecoder();
      let buffer = "";
      const newSections: SectionContent[] = [];
      let currentSectionId = "";
      let currentContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));

          switch (data.event) {
            case "section_start": {
              currentSectionId = data.sectionId;
              currentContent = "";
              currentSectionRef(data.sectionId);
              setCurrentChunk("");
              break;
            }
            case "section_chunk": {
              currentContent += data.text;
              setCurrentChunk(currentContent);
              break;
            }
            case "section_done": {
              const completedSection: SectionContent = {
                sectionId: data.sectionId,
                title: data.title || currentSectionId,
                content: currentContent,
                sources: data.sources || [],
                status: "completed",
              };
              newSections.push(completedSection);
              setSections([...newSections]);
              setCurrentChunk("");
              break;
            }
            case "done": {
              break;
            }
            case "error": {
              throw new Error(data.message || "生成失败");
            }
          }
        }
      }

      // 生成完毕，获取完整内容
      const detailRes = await fetch(`/api/doc-gen/${docId}`);
      const detailJson = await detailRes.json();
      if (detailJson.data?.full_content) {
        onComplete(detailJson.data.full_content);
      }
      toast.success("文档生成完毕！");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "生成失败";
      onError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
      setCurrentChunk("");
    }
  }

  function stopGeneration() {
    abortRef.current?.abort();
    setGenerating(false);
    toast.info("已停止生成");
  }

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const completedCount = sections.length;
  const progress = totalSections > 0 ? Math.round((completedCount / totalSections) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* 生成控制栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {generating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              正在生成 {completedCount}/{totalSections}...
            </div>
          )}
          {initialStatus === "completed" && !generating && (
            <span className="text-sm text-green-600 font-medium">
              ✅ 已完成生成
            </span>
          )}
          {initialStatus === "error" && !generating && (
            <span className="text-sm text-destructive">
              ❌ {errorMessage}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {!generating && initialStatus !== "completed" && (
            <Button onClick={startGeneration} size="sm">
              {initialStatus === "error" ? "重新生成" : "开始生成"}
            </Button>
          )}
          {generating && (
            <Button onClick={stopGeneration} variant="outline" size="sm">
              停止
            </Button>
          )}
        </div>
      </div>

      {/* 进度条 */}
      {(generating || completedCount > 0) && (
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 章节导航 */}
      {sections.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sections.map((s, i) => (
            <button
              key={s.sectionId}
              onClick={() => setActiveSection(s.sectionId)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                activeSection === s.sectionId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:bg-muted"
              }`}
            >
              {i + 1}. {s.title}
            </button>
          ))}
        </div>
      )}

      {/* 章节内容 */}
      <div className="space-y-4">
        {sections.map((s) => (
          <Card
            key={s.sectionId}
            id={`section-${s.sectionId}`}
            className={activeSection === s.sectionId ? "ring-1 ring-primary" : ""}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {s.content}
                </ReactMarkdown>
              </div>
              {s.sources && s.sources.length > 0 && (
                <SourceList sources={s.sources} />
              )}
            </CardContent>
          </Card>
        ))}

        {/* 正在生成的章节（实时内容） */}
        {generating && currentChunk && (
          <Card className="ring-1 ring-primary/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                生成中...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentChunk}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function SourceList({ sources }: { sources: MessageSource[] }) {
  const [open, setOpen] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="mt-3 border-t pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-90" : ""}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        参考来源 ({sources.length})
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {sources.map((s, i) => (
            <div
              key={i}
              className="text-xs bg-muted/50 rounded p-2 text-muted-foreground"
            >
              <span className="font-medium text-foreground">
                {s.documentName}
              </span>
              {s.page && <span className="ml-1">(第{s.page}页)</span>}
              <p className="mt-1 line-clamp-2">{s.chunkContent}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
