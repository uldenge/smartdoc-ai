/**
 * 独立的文档文本提取脚本
 * 支持: PDF, TXT, MD, DOCX, PPTX, XLSX, EPUB
 * 通过 child_process 调用，绕过 Next.js Turbopack 的 Worker 限制
 *
 * 用法: node src/scripts/doc-extract.mjs <file-path>
 * 输出: __DOC_RESULT__{json}__DOC_RESULT__
 */

import { pathToFileURL } from "url";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = process.argv[2];

if (!filePath) {
  process.stderr.write("Usage: node doc-extract.mjs <file-path>\n");
  process.exit(1);
}

const ext = path.extname(filePath).toLowerCase().replace(".", "");

// ==================== PDF 解析 ====================
async function extractPdf(buffer) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const workerPath = path.join(
    __dirname,
    "../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
  );
  pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  });

  const pdfDocument = await loadingTask.promise;
  const textParts = [];

  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .filter((item) => "str" in item)
      .map((item) => item.str)
      .join(" ");
    if (pageText.trim()) {
      textParts.push(pageText);
    }
  }

  await pdfDocument.destroy();
  return { text: textParts.join("\n\n"), pages: pdfDocument.numPages };
}

// ==================== DOCX 解析 ====================
async function extractDocx(buffer) {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value, pages: null };
}

// ==================== PPTX 解析 ====================
async function extractPptx(buffer) {
  // pptxtojson ESM 入口是 dist/index.js，导出 parse 方法
  const mod = await import("pptxtojson/dist/index.js");
  const parse = mod.parse || mod.default?.parse || mod.default;
  const result = await parse(buffer);

  // pptxtojson 返回 { slides: [{ elements: [{ content: "<p>...</p>", type }] }] }
  // content 是 HTML 格式，需要提取纯文本
  const slideTexts = [];
  if (result.slides && Array.isArray(result.slides)) {
    result.slides.forEach((slide, idx) => {
      const texts = [];
      if (slide.elements && Array.isArray(slide.elements)) {
        slide.elements.forEach((el) => {
          // 优先从 HTML content 提取文本
          const raw = el.content || el.text || "";
          if (raw && raw.trim()) {
            // 去除 HTML 标签，保留纯文本
            const plain = raw
              .replace(/<br\s*\/?>/gi, "\n")
              .replace(/<\/p>/gi, "\n")
              .replace(/<[^>]+>/g, "")
              .replace(/&nbsp;/g, " ")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .trim();
            if (plain) {
              texts.push(plain);
            }
          }
        });
      }
      if (texts.length > 0) {
        slideTexts.push(`--- 幻灯片 ${idx + 1} ---\n${texts.join("\n")}`);
      }
    });
  }

  return { text: slideTexts.join("\n\n"), pages: result.slides?.length || 0 };
}

// ==================== XLSX 解析 ====================
async function extractXlsx(buffer) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const sheetTexts = [];
  workbook.SheetNames.forEach((name) => {
    const sheet = workbook.Sheets[name];
    // 转为 CSV 格式文本，保留行列结构
    const csv = XLSX.utils.sheet_to_csv(sheet);
    if (csv && csv.trim()) {
      sheetTexts.push(`--- 工作表: ${name} ---\n${csv}`);
    }
  });

  return {
    text: sheetTexts.join("\n\n"),
    pages: workbook.SheetNames.length,
  };
}

// ==================== EPUB 解析 ====================
async function extractEpub(buffer) {
  const { EPub } = await import("epub2");
  const tmpFile = path.join(
    process.env.TEMP || process.env.TMP || "/tmp",
    `smartdoc-epub-${Date.now()}.epub`
  );

  // EPub 需要文件路径，写入临时文件
  const { writeFileSync, unlinkSync } = await import("fs");
  writeFileSync(tmpFile, buffer);

  try {
    return await new Promise((resolve, reject) => {
      const epub = new EPub(tmpFile);
      const chapters = [];

      epub.on("end", async () => {
        // 逐章获取内容
        for (const chapter of epub.flow) {
          if (!chapter.id) continue;
          try {
            const text = await new Promise((res, rej) => {
              epub.getChapter(chapter.id, (err, html) => {
                if (err) rej(err);
                else res(html || "");
              });
            });
            // 去除 HTML 标签，保留纯文本
            const plainText = text
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
              .replace(/<[^>]+>/g, " ")
              .replace(/&nbsp;/g, " ")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/\s+/g, " ")
              .trim();

            if (plainText) {
              const title = chapter.title || `章节`;
              chapters.push(`## ${title}\n${plainText}`);
            }
          } catch {
            // 跳过解析失败的章节
          }
        }

        resolve({
          text: chapters.join("\n\n"),
          pages: epub.flow?.length || 0,
        });
      });

      epub.on("error", reject);
      epub.parse();
    });
  } finally {
    try {
      unlinkSync(tmpFile);
    } catch {
      // 忽略清理失败
    }
  }
}

// ==================== TXT/MD 解析 ====================
function extractPlainText(buffer) {
  return { text: buffer.toString("utf-8"), pages: null };
}

// ==================== 主逻辑 ====================
const extractors = {
  pdf: extractPdf,
  docx: extractDocx,
  pptx: extractPptx,
  xlsx: extractXlsx,
  epub: extractEpub,
  txt: extractPlainText,
  md: extractPlainText,
};

try {
  const buffer = readFileSync(filePath);

  const extractor = extractors[ext];
  if (!extractor) {
    throw new Error(`不支持的文件类型: ${ext}`);
  }

  const result = await extractor(buffer);
  // 用特殊标记包裹 JSON 输出，避免 pdfjs/lib Warning 污染
  process.stdout.write(
    "__DOC_RESULT__" + JSON.stringify(result) + "__DOC_RESULT__\n"
  );
} catch (error) {
  process.stderr.write(JSON.stringify({ error: error.message }) + "\n");
  process.exit(1);
}
