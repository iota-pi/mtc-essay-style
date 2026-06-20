import JSZip from "jszip";
import * as fs from "fs";
import * as path from "path";

export async function createMockDocx(
  documentXml: string,
  stylesXml?: string,
  footnotesXml?: string
): Promise<Buffer> {
  const zip = new JSZip();
  zip.file("word/document.xml", documentXml);
  if (stylesXml) {
    zip.file("word/styles.xml", stylesXml);
  }
  if (footnotesXml) {
    zip.file("word/footnotes.xml", footnotesXml);
  }
  return await zip.generateAsync({ type: "nodebuffer" });
}

export function writeTempDocx(buffer: Buffer, filename: string): string {
  const tempDir = path.resolve("./temp_tests");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  const filePath = path.join(tempDir, filename);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

export function cleanTempDir() {
  const tempDir = path.resolve("./temp_tests");
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
