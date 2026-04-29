"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ConversationList } from "@/components/chat/conversation-list";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  return (
    <div className="flex h-full">
      {/* 左侧：对话历史侧边栏 */}
      {sidebarOpen && (
        <div className="w-72 border-r flex flex-col shrink-0">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-sm font-semibold">对话历史</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="收起侧边栏"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationList activeId={conversationId} />
          </div>
          <div className="p-3 border-t">
            <a
              href="/dashboard"
              className="block w-full rounded-lg border px-3 py-2 text-center text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              + 从知识库新建对话
            </a>
          </div>
        </div>
      )}

      {/* 右侧：聊天主区域 */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* 顶部栏 */}
        <div className="border-b px-4 py-3 flex items-center gap-3">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="展开侧边栏"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
              </svg>
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-medium truncate">
              {knowledgeBaseName}
            </h2>
            <p className="text-xs text-muted-foreground">
              基于知识库的 AI 问答
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            返回仪表盘
          </button>
        </div>

        {/* 消息列表 */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1">
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
              <p className="text-sm text-muted-foreground">加载中...</p>
            </div>
          </div>
        ) : (
          <MessageList
            messages={displayMessages}
            isStreaming={isStreaming && !streamingContent}
          />
        )}

        {/* 输入框 */}
        <ChatInput onSend={handleSend} disabled={isStreaming || isLoading} />
      </div>
    </div>
  );
}
