import { StyleRule, StyleViolation } from "../types.js";
import { BIBLE_BOOK_PATTERN } from "../data/sbl-books.js";
import { getParagraphText } from "../utils.js";

// Regex for bible references: a book name/abbreviation, followed by space, followed by a chapter and/or verse number
// e.g. Gen 1, Gen 1:1, Gen 1.1, 1 Cor 13, Ps 23:1-6
const BIBLE_REF_REGEX = new RegExp(
  `(?:${BIBLE_BOOK_PATTERN.source})\\s+\\d+(?:[.:]\\d+)?(?:\\s*[-–]\\s*\\d+)?`,
  "gi"
);

export const bibleRefsInFootnotesRule: StyleRule = {
  id: "sbl-bible-refs-in-footnotes",
  name: "Bible References in Footnotes",
  description: "Checks that biblical references are inline in the text rather than in footnotes.",
  scope: ["footnote"],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = [];
    const doc = context.document;

    for (const footnote of doc.footnotes) {
      for (let i = 0; i < footnote.paragraphs.length; i++) {
        const para = footnote.paragraphs[i];
        const text = getParagraphText(para);
        
        // Find matches
        BIBLE_REF_REGEX.lastIndex = 0;
        let match;
        while ((match = BIBLE_REF_REGEX.exec(text)) !== null) {
          const matchedText = match[0];
          violations.push({
            ruleId: this.id,
            ruleName: this.name,
            severity: "error",
            message: `Footnote contains Bible reference "${matchedText}". SBL v2 requires biblical references to be inline in the body text.`,
            paragraphIndex: undefined, // Footnote paragraphs don't map to main document paragraphs index
            region: undefined,
            detail: `Footnote ID: ${footnote.id}, Text: "${text}"`
          });
        }
      }
    }

    return violations;
  }
};
export default bibleRefsInFootnotesRule;
