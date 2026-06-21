import { ParsedDocument, DocxParagraph, RunProperties, ParagraphProperties } from "../docx/types.js";
import { DocumentSections, DocumentRegion } from "../analysis/sections.js";

export type Severity = "error" | "warning" | "info";

export type RuleScope = "body" | "footnote" | "bibliography" | "document";

export interface StyleViolation {
  ruleId: string;
  ruleName: string;
  severity: Severity;
  message: string;
  paragraphIndex?: number;    // original index in paragraphs array if applicable
  region?: DocumentRegion;
  detail?: string;            // additional debugging info
  correction?: {
    found: string;
    expected: string;
  };
  paragraphSnippet?: string;
}

export interface RuleContext {
  document: ParsedDocument;
  sections: DocumentSections;
  resolveRunProperties: (run: any, para: DocxParagraph) => RunProperties;
  resolveParagraphProperties: (para: DocxParagraph) => ParagraphProperties;
}

export interface StyleRule {
  id: string;
  name: string;
  description: string;
  scope: RuleScope[];
  check(context: RuleContext): StyleViolation[];
}
