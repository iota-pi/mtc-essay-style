import { DocxParagraph, ParsedDocument } from "../docx/types.js";
import { RuleContext } from "./types.js";
import { DocumentSections, DocumentRegion } from "../analysis/sections.js";

/**
 * Concatenates all run text from a paragraph
 */
export function getParagraphText(para: DocxParagraph): string {
  return para.runs.map(r => r.text).join("");
}

/**
 * Checks if a paragraph is a heading (has outlineLevel or style indicating heading)
 */
export function isHeading(para: DocxParagraph, context: RuleContext): boolean {
  const resolved = context.resolveParagraphProperties(para);
  
  if (resolved.outlineLevel !== undefined && resolved.outlineLevel >= 0 && resolved.outlineLevel <= 8) {
    return true;
  }
  
  const styleId = resolved.styleId;
  if (styleId) {
    const style = context.document.styles.get(styleId);
    if (style && style.name && style.name.toLowerCase().includes("heading")) {
      return true;
    }
  }
  
  return false;
}

/**
 * Finds the index of a paragraph within doc.paragraphs by identity
 */
export function findParagraphIndex(para: DocxParagraph, doc: ParsedDocument): number {
  return doc.paragraphs.indexOf(para);
}

/**
 * Gets the document region for a given paragraph reference
 */
export function getRegionForParagraph(para: DocxParagraph, sections: DocumentSections): DocumentRegion {
  if (sections.titlePage.includes(para)) {
    return "title-page";
  }
  if (sections.bibliography.includes(para)) {
    return "bibliography";
  }
  return "body";
}
