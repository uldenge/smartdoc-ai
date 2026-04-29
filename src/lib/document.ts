import { PDFParse } from "pdf-parse";

// ==================== 文本提取 ====================

export async function extractText(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  switch (fileType) {
    case "pdf":
      return extractPdfText(buffer);
    case "txt":
    case "md":
      return buffer.toString("utf-8");
    default:
      throw new Error(`不支持的文件类型: ${fileType}`);
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

// ==================== 文本清洗 ====================

export function cleanText(raw: string): string {
  return raw
    .replace(/\0/g, "")           // 去除空字符
    .replace(/\r\n/g, "\n")       // 统一换行符
    .replace(/\t/g, " ")          // Tab 转空格
    .replace(/[ \t]+/g, " ")      // 多空格合并
    .replace(/\n{3,}/g, "\n\n")   // 多空行合并为两个
    .trim();
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
