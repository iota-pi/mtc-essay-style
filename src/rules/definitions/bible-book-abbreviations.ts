import { StyleRule, StyleViolation } from "../types.js";
import { SBL_BOOK_MAP, SBL_VALID_ABBREVIATIONS, COMMON_WRONG_ABBREVIATIONS, BIBLE_BOOK_PATTERN, SBL_ABBREV_TO_FULL } from "../data/sbl-books.js";
import { getParagraphText, findParagraphIndex, getRegionForParagraph, isInsideParentheses, getParagraphSnippet } from "../utils.js";
import { DocumentRegion } from "../../analysis/sections.js";

// Regex to find a book word followed by a space and a chapter number
const CITATION_REGEX = new RegExp(
  `\\b(${BIBLE_BOOK_PATTERN.source})\\s+(\\d+)(?:[.:]\\d+)?`,
  "gi"
);

export const bibleBookAbbreviationsRule: StyleRule = {
  id: "sbl-bible-book-abbreviations",
  name: "Bible Book Abbreviations",
  description: "Checks that biblical book abbreviations match the SBL v2 canonical list inside parentheses, and full names are used in running text.",
  scope: ["body"],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = [];
    const doc = context.document;
    const sections = context.sections;

    const processText = (text: string, pIndex: number | undefined, region: DocumentRegion | undefined) => {
      if (region === "title-page" || region === "bibliography") {
        return;
      }

      CITATION_REGEX.lastIndex = 0;
      let match;
      while ((match = CITATION_REGEX.exec(text)) !== null) {
        const fullMatch = match[0];
        const rawBook = match[1];
        const lowerBook = rawBook.toLowerCase();
        const inParentheses = isInsideParentheses(text, match.index);
        
        // 1. Check if it's a known wrong abbreviation
        if (COMMON_WRONG_ABBREVIATIONS.has(lowerBook)) {
          const correctAbbrev = COMMON_WRONG_ABBREVIATIONS.get(lowerBook)!;
          const expectedFullMatch = correctAbbrev + fullMatch.substring(rawBook.length);
          if (inParentheses) {
            violations.push({
              ruleId: bibleBookAbbreviationsRule.id,
              ruleName: bibleBookAbbreviationsRule.name,
              severity: "error",
              message: "Incorrect Bible book abbreviation inside parentheses",
              paragraphIndex: pIndex,
              region,
              correction: {
                found: fullMatch,
                expected: expectedFullMatch
              },
              paragraphSnippet: getParagraphSnippet(text)
            });
          } else {
            // Outside parentheses, it should be the full book name!
            const fullName = SBL_ABBREV_TO_FULL.get(correctAbbrev.toLowerCase()) || correctAbbrev;
            const expectedFullMatchOutside = fullName + fullMatch.substring(rawBook.length);
            violations.push({
              ruleId: bibleBookAbbreviationsRule.id,
              ruleName: bibleBookAbbreviationsRule.name,
              severity: "error",
              message: "Incorrect Bible book form in running text",
              paragraphIndex: pIndex,
              region,
              correction: {
                found: fullMatch,
                expected: expectedFullMatchOutside
              },
              paragraphSnippet: getParagraphSnippet(text)
            });
          }
          continue;
        }

        // 2. Check if it's a full book name
        const mappedAbbrev = SBL_BOOK_MAP.get(lowerBook);
        const isFullBookName = mappedAbbrev && mappedAbbrev.toLowerCase() !== lowerBook;

        if (isFullBookName) {
          // If we are inside parentheses, it must be the abbreviation!
          if (inParentheses) {
            const expectedFullMatch = mappedAbbrev + fullMatch.substring(rawBook.length);
            violations.push({
              ruleId: bibleBookAbbreviationsRule.id,
              ruleName: bibleBookAbbreviationsRule.name,
              severity: "error",
              message: "Use SBL book abbreviation inside parentheses",
              paragraphIndex: pIndex,
              region,
              correction: {
                found: fullMatch,
                expected: expectedFullMatch
              },
              paragraphSnippet: getParagraphSnippet(text)
            });
          }
        } else {
          // It is an abbreviation.
          // If we are OUTSIDE parentheses, it must be the full name (if different)!
          if (!inParentheses) {
            const fullName = SBL_ABBREV_TO_FULL.get(lowerBook);
            if (fullName && fullName.toLowerCase() !== lowerBook) {
              const expectedFullMatch = fullName + fullMatch.substring(rawBook.length);
              violations.push({
                ruleId: bibleBookAbbreviationsRule.id,
                ruleName: bibleBookAbbreviationsRule.name,
                severity: "error",
                message: "Use full Bible book name in running text",
                paragraphIndex: pIndex,
                region,
                correction: {
                  found: fullMatch,
                  expected: expectedFullMatch
                },
                paragraphSnippet: getParagraphSnippet(text)
              });
            }
          }
        }
      }
    };

    // Process body paragraphs
    for (const para of doc.paragraphs) {
      const text = getParagraphText(para);
      const pIndex = findParagraphIndex(para, doc);
      const region = getRegionForParagraph(para, sections);
      processText(text, pIndex, region);
    }

    return violations;
  }
};
export default bibleBookAbbreviationsRule;

