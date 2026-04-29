"use client";

import { useRouter } from "next/navigation";
import { UploadButton } from "./upload-button";
import { DocumentList } from "./document-list";

interface DetailContentProps {
  knowledgeBaseId: string;
}

export function DetailContent({ knowledgeBaseId }: DetailContentProps) {
  const router = useRouter();

  function handleUploadSuccess() {
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <UploadButton
          knowledgeBaseId={knowledgeBaseId}
          onSuccess={handleUploadSuccess}
        />
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
