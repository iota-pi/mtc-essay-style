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

import { ParsedDocument, DocxParagraph } from "../src/docx/types";
import { DocumentSections } from "../src/analysis/sections";
import { RuleContext } from "../src/rules/types";
import { resolveRunProperties, resolveParagraphProperties } from "../src/docx/style-resolver";

/** Create a minimal DocxParagraph with text and optional overrides */
export function createTestParagraph(text: string, overrides?: Partial<DocxParagraph>): DocxParagraph {
  return {
    runs: [{ text, properties: {} }],
    properties: {},
    hasPageBreakBefore: false,
    hasImage: false,
    footnoteRefs: [],
    ...overrides
  };
}

/** Create a minimal ParsedDocument with optional overrides */
export function createTestDocument(overrides?: Partial<ParsedDocument>): ParsedDocument {
  return {
    paragraphs: [],
    footnotes: [],
    styles: new Map(),
    hasHeaderOrFooter: true,
    ...overrides
  };
}

/** Create a RuleContext with sensible defaults */
export function createTestContext(doc: ParsedDocument, sections: DocumentSections): RuleContext {
  return {
    document: doc,
    sections,
    resolveRunProperties: (run, para) => resolveRunProperties(run, para, doc),
    resolveParagraphProperties: (para) => resolveParagraphProperties(para, doc)
  };
}

