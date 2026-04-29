"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
}

/** 单条来源引用卡片 */
function SourceCard({
  source,
  index,
}: {
  source: { documentName: string; chunkContent: string };
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="mt-1 rounded-md border border-border/40 bg-background/50 px-2.5 py-1.5"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 text-left text-xs"
      >
        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
          {index + 1}
        </span>
        <span className="truncate font-medium">{source.documentName}</span>
        <span className="ml-auto shrink-0 text-muted-foreground">
          {expanded ? "收起" : "展开"}
        </span>
      </button>
      {expanded && (
        <p className="mt-1.5 pl-5.5 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
          {source.chunkContent}
        </p>
      )}
    </div>
  );
}

/** AI 消息的 Markdown 渲染 */
function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-pre:my-2 prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <div className="text-center space-y-3">
          <div className="text-4xl">💬</div>
          <p className="text-lg font-medium">开始对话</p>
          <p className="text-sm">向 AI 提问关于知识库的任何问题</p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {["这个知识库包含什么内容？", "总结一下主要知识点"].map(
              (hint) => (
                <span
                  key={hint}
                  className="rounded-full border px-3 py-1 text-xs text-muted-foreground"
                >
                  {hint}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted rounded-bl-md"
            }`}
          >
            {/* 消息内容 */}
            {msg.role === "assistant" ? (
              <div className="text-sm leading-relaxed">
                <MarkdownContent content={msg.content} />
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {msg.content}
              </div>
            )}

            {/* 引用来源（仅 AI 消息） */}
            {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <p className="text-xs font-medium opacity-70 mb-2 flex items-center gap-1">
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
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  引用来源
                </p>
                <div className="space-y-1">
                  {msg.sources.map((source, i) => (
                    <SourceCard key={i} source={source} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* 打字指示器 */}
      {isStreaming && (
        <div className="flex justify-start">
          <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="inline-block w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="inline-block w-2 h-2 bg-foreground/40 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
