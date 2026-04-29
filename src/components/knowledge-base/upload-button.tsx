"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface UploadButtonProps {
  knowledgeBaseId: string;
  onSuccess: () => void;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function UploadButton({ knowledgeBaseId, onSuccess }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setStatus("");

    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|txt|md)$/i)) {
      setError("仅支持 PDF、TXT、Markdown 文件");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("文件大小不能超过 10MB");
      return;
    }

    setUploading(true);
    setStatus("上传中...");

    try {
      // Step 1: 上传文件
      const formData = new FormData();
      formData.append("file", file);
      formData.append("knowledgeBaseId", knowledgeBaseId);

      const uploadRes = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        setError(uploadData.error);
        return;
      }

      // Step 2: 自动触发文档处理
      setStatus("处理中...");
      const processRes = await fetch("/api/documents/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: uploadData.data.id }),
      });

      const processData = await processRes.json();

      if (!processRes.ok) {
        // 处理失败不影响上传，但显示警告
        setError(`上传成功但处理失败: ${processData.error}`);
        onSuccess();
        return;
      }

      setStatus("");
      onSuccess();
    } catch {
      setError("上传失败，请重试");
    } finally {
      setUploading(false);
      setStatus("");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />
      <Button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? status || "上传中..." : "上传文档"}
      </Button>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
