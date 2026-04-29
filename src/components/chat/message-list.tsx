"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">开始对话</p>
          <p className="mt-2 text-sm">向 AI 提问关于知识库的任何问题</p>
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
            className={`max-w-[80%] rounded-lg px-4 py-3 ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {msg.content}
            </div>

            {/* 引用来源 */}
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs font-medium opacity-70 mb-1">
                  引用来源:
                </p>
                {msg.sources.map((source, i) => (
                  <div
                    key={i}
                    className="text-xs opacity-60 mt-1 bg-background/30 rounded px-2 py-1"
                  >
                    {source.documentName}: {source.chunkContent.slice(0, 80)}...
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {isStreaming && (
        <div className="flex justify-start">
          <div className="bg-muted rounded-lg px-4 py-3">
            <div className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="inline-block w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="inline-block w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
