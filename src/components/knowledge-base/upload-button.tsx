"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface UploadButtonProps {
  knowledgeBaseId: string;
  onSuccess: () => void;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/epub+zip",
];

const ACCEPTED_EXTENSIONS = /\.(pdf|txt|md|docx|pptx|xlsx|epub)$/i;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const FILE_TYPE_LABEL = "PDF、TXT、Markdown、DOCX、PPTX、XLSX、EPUB";

export function UploadButton({
  knowledgeBaseId,
  onSuccess,
}: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("");

    if (
      !ACCEPTED_TYPES.includes(file.type) &&
      !file.name.match(ACCEPTED_EXTENSIONS)
    ) {
      toast.error("文件格式不支持", {
        description: `仅支持 ${FILE_TYPE_LABEL} 文件`,
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("文件过大", { description: "文件大小不能超过 10MB" });
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
        toast.error("上传失败", { description: uploadData.error });
        return;
      }

      toast.success("上传成功", { description: `${file.name} 已上传` });

      // Step 2: 自动触发文档处理
      setStatus("AI 处理中...");
      const processRes = await fetch("/api/documents/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: uploadData.data.id }),
      });

      const processData = await processRes.json();

      if (!processRes.ok) {
        toast.warning("处理未完成", { description: processData.error });
        onSuccess();
        return;
      }

      toast.success("处理完成", { description: `${file.name} 已可问答` });
      onSuccess();
    } catch {
      toast.error("上传失败", { description: "网络错误，请重试" });
    } finally {
      setUploading(false);
      setStatus("");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md,.docx,.pptx,.xlsx,.epub"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />
      <Button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (status || "上传中...") : "上传文档"}
      </Button>
    </div>
  );
}
