"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadButton } from "./upload-button";
import { DocumentList } from "./document-list";

interface DetailContentProps {
  knowledgeBaseId: string;
}

export function DetailContent({ knowledgeBaseId }: DetailContentProps) {
  const router = useRouter();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  function handleUploadSuccess() {
    router.refresh();
  }

  async function handleStartChat() {
    setIsCreatingChat(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ knowledgeBaseId }),
      });
      const data = await res.json();
      if (data.data?.id) {
        router.push(`/chat/${data.data.id}`);
      }
    } catch (e) {
      console.error("创建对话失败:", e);
      setIsCreatingChat(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <UploadButton
          knowledgeBaseId={knowledgeBaseId}
          onSuccess={handleUploadSuccess}
        />
        <button
          onClick={handleStartChat}
          disabled={isCreatingChat}
          className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isCreatingChat ? "创建中..." : "开始对话"}
        </button>
        <button
          onClick={() => router.refresh()}
          className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
        >
          刷新
        </button>
      </div>
      <DocumentList knowledgeBaseId={knowledgeBaseId} />
    </>
  );
}
