import { StyleRule, StyleViolation } from "../types.js";
import { SBL_BOOK_MAP, SBL_VALID_ABBREVIATIONS, COMMON_WRONG_ABBREVIATIONS, BIBLE_BOOK_PATTERN } from "../data/sbl-books.js";
import { getParagraphText, findParagraphIndex, getRegionForParagraph } from "../utils.js";
import { DocumentRegion } from "../../analysis/sections.js";

// Regex to find a book word followed by a space and a chapter number
const CITATION_REGEX = new RegExp(
  `\\b(${BIBLE_BOOK_PATTERN.source})\\s+(\\d+)(?:[.:]\\d+)?`,
  "gi"
);

export const bibleBookAbbreviationsRule: StyleRule = {
  id: "sbl-bible-book-abbreviations",
  name: "Bible Book Abbreviations",
  description: "Checks that biblical book abbreviations match the SBL v2 canonical list (no periods, correct abbreviations, and using abbreviations when followed by a citation).",
  scope: ["body", "footnote"],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = [];
    const doc = context.document;
    const sections = context.sections;

    const processText = (text: string, pIndex: number | undefined, region: DocumentRegion | undefined, footnoteId?: string) => {
      if (region === "title-page" || region === "bibliography") {
        return;
      }

      CITATION_REGEX.lastIndex = 0;
      let match;
      while ((match = CITATION_REGEX.exec(text)) !== null) {
        const fullMatch = match[0];
        const rawBook = match[1];
        const lowerBook = rawBook.toLowerCase();
        
        // 1. Check if it's a known wrong abbreviation
        if (COMMON_WRONG_ABBREVIATIONS.has(lowerBook)) {
          const correct = COMMON_WRONG_ABBREVIATIONS.get(lowerBook);
          violations.push({
            ruleId: this.id,
            ruleName: this.name,
            severity: "error",
            message: `Incorrect Bible book abbreviation "${rawBook}" in citation "${fullMatch}". Use the SBL v2 standard abbreviation "${correct}" (no period).`,
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined
          });
          continue;
        }

        // 2. Check if it's a full book name instead of an abbreviation
        // e.g. "Genesis 1:1" should be "Gen 1:1"
        const mappedAbbrev = SBL_BOOK_MAP.get(lowerBook);
        if (mappedAbbrev && mappedAbbrev.toLowerCase() !== lowerBook) {
          // If the book is at the start of a sentence, SBL allows/requires spelling it out.
          // Let's do a simple check: is it preceded by a period/question/exclamation and space?
          const matchIndex = match.index;
          const precedingText = text.substring(Math.max(0, matchIndex - 3), matchIndex);
          const isSentenceStart = matchIndex === 0 || /[.!?]\s+$/.test(precedingText);

          if (!isSentenceStart) {
            violations.push({
              ruleId: this.id,
              ruleName: this.name,
              severity: "error",
              message: `Use the SBL abbreviation "${mappedAbbrev}" instead of the full book name "${rawBook}" when followed by a citation (found "${fullMatch}").`,
              paragraphIndex: pIndex,
              region,
              detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined
            });
          }
        }
      }
    }

    // Process body paragraphs
    for (const para of doc.paragraphs) {
      const text = getParagraphText(para);
      const pIndex = findParagraphIndex(para, doc);
      const region = getRegionForParagraph(para, sections);
      processText(text, pIndex, region);
    }

    // Process footnotes
    for (const footnote of doc.footnotes) {
      for (const para of footnote.paragraphs) {
        const text = getParagraphText(para);
        processText(text, undefined, undefined, String(footnote.id));
      }
    }

    return violations;
  }
};
export default bibleBookAbbreviationsRule;
