/**
 * 独立的 PDF 文本提取脚本
 * 通过 child_process 调用，绕过 Next.js Turbopack 的 Worker 限制
 *
 * 用法: node src/scripts/pdf-extract.mjs <file-path>
 * 输出: __PDF_RESULT__{json}__PDF_RESULT__
 */

import { pathToFileURL } from "url";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = process.argv[2];

if (!filePath) {
  process.stderr.write("Usage: node pdf-extract.mjs <file-path>\n");
  process.exit(1);
}

async function extractText(buffer) {
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

try {
  const buffer = readFileSync(filePath);
  const result = await extractText(buffer);
  // 用特殊标记包裹 JSON 输出，避免 pdfjs Warning 污染
  process.stdout.write("__PDF_RESULT__" + JSON.stringify(result) + "__PDF_RESULT__\n");
} catch (error) {
  process.stderr.write(JSON.stringify({ error: error.message }) + "\n");
  process.exit(1);
}
