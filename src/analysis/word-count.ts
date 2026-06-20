import { DocumentSections } from "./sections.js";
import { ParsedDocument, DocxParagraph } from "../docx/types.js";

export interface WordCountResult {
  total: number;          // body + footnotes (excludes title page & bibliography)
  bodyText: number;       // word count of body paragraphs only
  footnotes: number;      // word count of all footnotes (counted separately, included in total)
  bibliography: number;   // word count of bibliography (reported separately, NOT in total)
  titlePage: number;      // word count of title page (reported separately, NOT in total)
}

export function countWordsInText(text: string): number {
  if (!text) return 0;
  
  // Replace all types of whitespace (spaces, tabs, newlines, non-breaking spaces) with a standard space
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) return 0;

  const tokens = cleanText.split(" ");
  let count = 0;
  for (const token of tokens) {
    // If the token contains at least one letter or number, count it as a word
    if (/[a-zA-Z0-9\u00C0-\u017F]/.test(token)) {
      count++;
    }
  }
  return count;
}

function countWordsInParagraphs(paragraphs: DocxParagraph[]): number {
  let count = 0;
  for (const para of paragraphs) {
    const text = para.runs.map(r => r.text).join("");
    count += countWordsInText(text);
  }
  return count;
}

export function countWords(
  doc: ParsedDocument,
  sections: DocumentSections
): WordCountResult {
  const bodyText = countWordsInParagraphs(sections.body);
  const titlePage = countWordsInParagraphs(sections.titlePage);
  const bibliography = countWordsInParagraphs(sections.bibliography);

  // Count footnote words
  let footnotes = 0;
  for (const fn of doc.footnotes) {
    footnotes += countWordsInParagraphs(fn.paragraphs);
  }

  // Total word count includes body text and footnotes, but excludes title page and bibliography
  const total = bodyText + footnotes;

  return {
    total,
    bodyText,
    footnotes,
    bibliography,
    titlePage
  };
}
