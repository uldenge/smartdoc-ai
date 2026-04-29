"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import type { Message, MessageSource } from "@/types";

interface ChatContainerProps {
  conversationId: string;
  knowledgeBaseId: string;
  knowledgeBaseName: string;
}

export function ChatContainer({
  conversationId,
  knowledgeBaseId,
  knowledgeBaseName,
}: ChatContainerProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  // 加载历史消息
  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch(
          `/api/chat/messages?conversationId=${conversationId}`
        );
        const data = await res.json();
        if (data.data) {
          setMessages(data.data);
        }
      } catch (e) {
        console.error("加载消息失败:", e);
      } finally {
        setIsLoading(false);
      }
    }

    loadMessages();
  }, [conversationId]);

  // 发送消息 + 流式接收 AI 回答
  const handleSend = useCallback(
    async (content: string) => {
      // 添加用户消息到 UI（乐观更新）
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId,
        userId: "",
        role: "user",
        content,
        sources: null,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setStreamingContent("");

      try {
        const res = await fetch("/api/chat/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, content }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "发送失败");
        }

        // 读取 SSE 流
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let aiContent = "";
        let aiSources: MessageSource[] | null = null;

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            const lines = text.split("\n");

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;

              try {
                const parsed = JSON.parse(line.slice(6));

                if (parsed.error) {
                  throw new Error(parsed.error);
                }

                if (parsed.done) {
                  aiSources = parsed.sources || null;
                } else if (parsed.text) {
                  aiContent += parsed.text;
                  setStreamingContent(aiContent);
                }
              } catch {
                // 忽略非 JSON 行
              }
            }
          }
        }

        // 添加 AI 回复到消息列表
        const aiMessage: Message = {
          id: `temp-ai-${Date.now()}`,
          conversationId,
          userId: "",
          role: "assistant",
          content: aiContent,
          sources: aiSources,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch (e) {
        const errorMessage: Message = {
          id: `temp-err-${Date.now()}`,
          conversationId,
          userId: "",
          role: "assistant",
          content: `出错了: ${e instanceof Error ? e.message : "未知错误"}`,
          sources: null,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
      }
    },
    [conversationId]
  );

  // 流式内容作为临时 AI 消息显示
  const displayMessages = [...messages];
  if (isStreaming && streamingContent) {
    displayMessages.push({
      id: "streaming",
      conversationId,
      userId: "",
      role: "assistant",
      content: streamingContent,
      sources: null,
      createdAt: new Date().toISOString(),
    });
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">{knowledgeBaseName}</h2>
          <p className="text-xs text-muted-foreground">
            基于知识库的 AI 问答
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          返回仪表盘
        </button>
      </div>

      {/* 消息列表 */}
      <MessageList messages={displayMessages} isStreaming={isStreaming && !streamingContent} />

      {/* 输入框 */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
