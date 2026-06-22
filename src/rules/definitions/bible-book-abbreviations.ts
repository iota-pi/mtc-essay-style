import { StyleRule, StyleViolation } from "../types.js";
import { SBL_BOOK_MAP, SBL_VALID_ABBREVIATIONS, COMMON_WRONG_ABBREVIATIONS, BIBLE_BOOK_PATTERN, SBL_ABBREV_TO_FULL } from "../data/sbl-books.js";
import { getParagraphText, findParagraphIndex, getRegionForParagraph, isInsideParentheses, isSentenceStart, getParagraphSnippet } from "../utils.js";
import { DocumentRegion } from "../../analysis/sections.js";

const NUMBERED_BOOKS_SPELLED = new Map<string, string>([
  ["1 samuel", "First Samuel"],
  ["2 samuel", "Second Samuel"],
  ["1 kings", "First Kings"],
  ["2 kings", "Second Kings"],
  ["1 chronicles", "First Chronicles"],
  ["2 chronicles", "Second Chronicles"],
  ["1 corinthians", "First Corinthians"],
  ["2 corinthians", "Second Corinthians"],
  ["1 thessalonians", "First Thessalonians"],
  ["2 thessalonians", "Second Thessalonians"],
  ["1 timothy", "First Timothy"],
  ["2 timothy", "Second Timothy"],
  ["1 peter", "First Peter"],
  ["2 peter", "Second Peter"],
  ["1 john", "First John"],
  ["2 john", "Second John"],
  ["3 john", "Third John"],
]);

export const bibleBookAbbreviationsRule: StyleRule = {
  id: "sbl-bible-book-abbreviations",
  name: "Bible Book Abbreviations",
  description: "Checks that biblical book names are correctly abbreviated or spelled out in running text and parenthetical citations.",
  scope: ["body"],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = [];
    const doc = context.document;
    const sections = context.sections;

    function getCanonicalNames(rawName: string): { abbrev: string; full: string } | undefined {
      const lower = rawName.toLowerCase().trim();
      let cleanLower = lower;
      if (COMMON_WRONG_ABBREVIATIONS.has(lower)) {
        cleanLower = COMMON_WRONG_ABBREVIATIONS.get(lower)!.toLowerCase();
      }
      
      let abbrev = SBL_BOOK_MAP.get(cleanLower);
      if (!abbrev) {
        for (const valid of SBL_VALID_ABBREVIATIONS) {
          if (valid.toLowerCase() === cleanLower) {
            abbrev = valid;
            break;
          }
        }
      }
      
      if (!abbrev) {
        for (const [ab, fName] of SBL_ABBREV_TO_FULL.entries()) {
          if (fName.toLowerCase() === cleanLower) {
            abbrev = SBL_BOOK_MAP.get(cleanLower);
            break;
          }
        }
      }
      
      if (!abbrev) {
        return undefined;
      }
      
      const full = SBL_ABBREV_TO_FULL.get(abbrev.toLowerCase()) || abbrev;
      return { abbrev, full };
    }

    const processText = (text: string, pIndex: number | undefined, region: DocumentRegion | undefined) => {
      if (region === "title-page" || region === "bibliography") {
        return;
      }

      BIBLE_BOOK_PATTERN.lastIndex = 0;
      let match;
      while ((match = BIBLE_BOOK_PATTERN.exec(text)) !== null) {
        const rawMatch = match[0];
        const matchIndex = match.index;
        const names = getCanonicalNames(rawMatch);
        if (!names) continue;
        
        const { abbrev, full } = names;
        const afterText = text.substring(matchIndex + rawMatch.length);
        
        // Match suffix containing chapter/verse: e.g. " 1:1" or " 1"
        const suffixMatch = afterText.match(/^\s+(\d+(?:[.:]\d+)?(?:[–-]\d+)?)/);
        const suffix = suffixMatch ? suffixMatch[0] : "";
        const isFollowedByChap = suffixMatch !== null;
        
        if (rawMatch === "mark" && !isFollowedByChap) {
          continue;
        }
        
        const inParentheses = isInsideParentheses(text, matchIndex);
        const startOfSentence = isSentenceStart(text, matchIndex);
        
        let expectedName = abbrev;
        let message = "Incorrect Bible book format";

        if (inParentheses) {
          expectedName = abbrev;
          message = "Use SBL book abbreviation inside parentheses";
        } else {
          if (isFollowedByChap) {
            if (startOfSentence) {
              expectedName = NUMBERED_BOOKS_SPELLED.get(full.toLowerCase()) || full;
              message = "Use spelled out book name at the start of a sentence";
            } else {
              expectedName = abbrev;
              message = "Use SBL book abbreviation in running text when cited with chapter/verse";
            }
          } else {
            if (startOfSentence) {
              expectedName = NUMBERED_BOOKS_SPELLED.get(full.toLowerCase()) || full;
              message = "Use spelled out book name at the start of a sentence";
            } else {
              expectedName = full;
              message = "Use spelled out book name in running text when cited without chapter/verse";
            }
          }
        }

        const fullMatch = rawMatch + suffix;
        const expectedFullMatch = expectedName + suffix;

        if (fullMatch !== expectedFullMatch) {
          violations.push({
            ruleId: bibleBookAbbreviationsRule.id,
            ruleName: bibleBookAbbreviationsRule.name,
            severity: "error",
            message,
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

