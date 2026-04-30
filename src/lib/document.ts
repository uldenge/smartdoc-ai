import { execFile } from "child_process";
import { join } from "path";
import { tmpdir } from "os";
import { writeFileSync, unlinkSync } from "fs";

/** 支持的文件类型 */
export const SUPPORTED_EXTENSIONS = [
  "pdf",
  "txt",
  "md",
  "docx",
  "pptx",
  "xlsx",
  "epub",
] as const;

export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

// ==================== 文本提取 ====================

export async function extractText(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  const ext = fileType.toLowerCase();

  // TXT/MD 可以直接在进程中处理，无需子进程
  if (ext === "txt" || ext === "md") {
    return buffer.toString("utf-8");
  }

  // 其他格式统一通过子进程调用 doc-extract.mjs
  return extractViaChildProcess(buffer, ext);
}

/**
 * 通过子进程调用独立脚本解析文档
 * 绕过 Next.js Turbopack 的 Worker/ESM 限制
 * 纯 Node.js 环境中 pathToFileURL 可靠工作
 */
async function extractViaChildProcess(
  buffer: Buffer,
  ext: string
): Promise<string> {
  // 将 buffer 写入临时文件（子进程需要文件路径）
  const tmpFile = join(tmpdir(), `smartdoc-${Date.now()}.${ext}`);
  writeFileSync(tmpFile, buffer);

  // 动态构建脚本路径（避免 Turbopack 静态分析报错）
  const cwd = process.cwd();
  const scriptSegments = [cwd, "src", "scripts", "doc-extract.mjs"];
  const scriptPath = scriptSegments.join("/");

  try {
    const result = await new Promise<{ text: string; pages: number | null }>(
      (resolve, reject) => {
        execFile(
          "node",
          [scriptPath, tmpFile],
          {
            timeout: 60000, // 60s 超时（大文件可能较慢）
            maxBuffer: 20 * 1024 * 1024, // 20MB
          },
          (error, stdout, stderr) => {
            if (error) {
              reject(new Error(error.message));
              return;
            }
            try {
              // 从 stdout 中提取 __DOC_RESULT__ 标记之间的 JSON
              const marker = "__DOC_RESULT__";
              const startIdx = stdout.indexOf(marker);
              const endIdx = stdout.lastIndexOf(marker);
              if (startIdx === -1 || endIdx === startIdx) {
                reject(new Error(stderr || "文档解析输出解析失败"));
                return;
              }
              const jsonStr = stdout.substring(
                startIdx + marker.length,
                endIdx
              );
              const parsed = JSON.parse(jsonStr);
              if (parsed.error) {
                reject(new Error(parsed.error));
                return;
              }
              resolve(parsed);
            } catch {
              reject(new Error(stderr || "文档解析输出解析失败"));
            }
          }
        );
      }
    );

    return result.text;
  } finally {
    // 清理临时文件
    try {
      unlinkSync(tmpFile);
    } catch {
      // 忽略清理失败
    }
  }
}

// ==================== 文本清洗 ====================

export function cleanText(raw: string): string {
  return (
    raw
      .replace(/\0/g, "") // 去除空字符
      .replace(/\r\n/g, "\n") // 统一换行符
      .replace(/\t/g, " ") // Tab 转空格
      .replace(/[ \t]+/g, " ") // 多空格合并
      .replace(/\n{3,}/g, "\n\n") // 多空行合并为两个
      .trim()
  );
}

// ==================== 文本分块 ====================

export interface ChunkResult {
  content: string;
  metadata: {
    position: number;
  };
}

export function splitText(
  text: string,
  chunkSize = 500,
  overlap = 50
): ChunkResult[] {
  if (!text || text.length === 0) return [];

  const chunks: ChunkResult[] = [];
  let position = 0;
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // 尝试在句子边界处切分
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf("。", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const lastSpace = text.lastIndexOf(" ", end);
      const boundary = Math.max(lastPeriod, lastNewline, lastSpace);

      if (boundary > start + chunkSize * 0.5) {
        end = boundary + 1;
      }
    }

    const content = text.slice(start, end).trim();
    if (content.length > 0) {
      chunks.push({
        content,
        metadata: { position },
      });
      position++;
    }

    start = end - overlap;
    if (start >= text.length) break;
    // 防止无限循环
    if (start <= end - chunkSize) start = end;
  }

  return chunks;
}
