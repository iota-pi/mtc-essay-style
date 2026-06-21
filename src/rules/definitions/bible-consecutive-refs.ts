import { StyleRule, StyleViolation } from "../types.js";
import { BIBLE_BOOK_PATTERN, SBL_BOOK_MAP, COMMON_WRONG_ABBREVIATIONS, SBL_VALID_ABBREVIATIONS } from "../data/sbl-books.js";
import { getParagraphText, findParagraphIndex, getRegionForParagraph, getParagraphSnippet } from "../utils.js";
import { DocumentRegion } from "../../analysis/sections.js";

// List of all book keys for matching
const ALL_BOOKS = Array.from(SBL_BOOK_MAP.keys())
  .concat(Array.from(SBL_VALID_ABBREVIATIONS).map(s => s.toLowerCase()))
  .concat(Array.from(COMMON_WRONG_ABBREVIATIONS.keys()))
  .sort((a, b) => b.length - a.length);

const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const bookAlternation = ALL_BOOKS.map(name => escapeRegExp(name)).join("|");

// Regex to find start of a citation: Book Name followed by a space and a chapter number
const CITATION_START_REGEX = new RegExp(
  `\\b(${BIBLE_BOOK_PATTERN.source})\\s+(\\d+)(?:[.:](\\d+(?:[–-]\\d+)?))?`,
  "gi"
);

// Regexes for subsequent elements in the list
const NEXT_BOOK_REGEX = new RegExp(
  `^\\s*([,;])?\\s*(?:(?:and|or)\\s+)?(${bookAlternation})\\s+(\\d+)(?:[.:](\\d+(?:[–-]\\d+)?))?`,
  "i"
);
const NEXT_CHAPTER_VERSE_REGEX = /^\s*([,;])?\s*(?:(?:and|or)\s+)?(\d+)[.:](\d+(?:[–-]\d+)?)/;
const NEXT_NUMBER_ONLY_REGEX = /^\s*([,;])?\s*(?:(?:and|or)\s+)?(\d+(?:[–-]\d+)?)/;

interface ParsedRef {
  book: string;
  chapter: number;
  verse?: string; // string to preserve ranges like "29–33"
  text: string;
  startIndex: number;
  endIndex: number;
}

export const bibleConsecutiveRefsRule: StyleRule = {
  id: "sbl-bible-consecutive-refs",
  name: "Consecutive Bible References Separator",
  description: "Checks that consecutive Bible references are separated by commas when in the same chapter and by semicolons when in different chapters or books, and flags redundant books/chapters.",
  scope: ["body", "footnote"],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = [];
    const doc = context.document;
    const sections = context.sections;

    function processText(text: string, pIndex: number | undefined, region: DocumentRegion | undefined, footnoteId?: string) {
      if (region === "title-page" || region === "bibliography") {
        return;
      }

      CITATION_START_REGEX.lastIndex = 0;
      let startMatch;

      while ((startMatch = CITATION_START_REGEX.exec(text)) !== null) {
        const firstBook = startMatch[1];
        const firstChapter = parseInt(startMatch[2], 10);
        const firstVerse = startMatch[3] || undefined;
        
        let prevRef: ParsedRef = {
          book: firstBook.toLowerCase(),
          chapter: firstChapter,
          verse: firstVerse,
          text: startMatch[0],
          startIndex: startMatch.index,
          endIndex: CITATION_START_REGEX.lastIndex
        };

        let scanIndex = prevRef.endIndex;

        // Loop to find next consecutive reference elements
        while (scanIndex < text.length) {
          const remaining = text.substring(scanIndex);
          let match: RegExpExecArray | null = null;
          let matchedType: "book" | "chapter-verse" | "number" | null = null;

          // Try matching next book
          if ((match = NEXT_BOOK_REGEX.exec(remaining)) !== null) {
            matchedType = "book";
          } 
          // Try matching next chapter:verse
          else if ((match = NEXT_CHAPTER_VERSE_REGEX.exec(remaining)) !== null) {
            matchedType = "chapter-verse";
          } 
          // Try matching next single number
          else if ((match = NEXT_NUMBER_ONLY_REGEX.exec(remaining)) !== null) {
            matchedType = "number";
          }

          if (!matchedType || !match) {
            break; // No consecutive citation pattern found
          }

          const matchedString = match[0];
          const separatorChar = match[1]; // ',' or ';' if explicitly captured at start
          const matchStart = scanIndex;
          const matchEnd = scanIndex + matchedString.length;

          // Check if there is any disallowed character (like a period) in the whitespace/conjunction before the match
          const prefix = matchedString.substring(0, matchedString.indexOf(match[2] || match[1] || matchedString.trim()));
          if (prefix.includes(".") || prefix.includes("?") || prefix.includes("!")) {
            break; // Sentence boundary, stop scanning this group
          }

          // Parse new ref properties
          let nextBook = prevRef.book;
          let nextChapter = prevRef.chapter;
          let nextVerse: string | undefined;
          let verseText = "";

          if (matchedType === "book") {
            nextBook = match[2].toLowerCase();
            nextChapter = parseInt(match[3], 10);
            nextVerse = match[4] || undefined;
            verseText = match[4] || "";
          } else if (matchedType === "chapter-verse") {
            nextChapter = parseInt(match[2], 10);
            nextVerse = match[3];
            verseText = match[3];
          } else if (matchedType === "number") {
            const num = parseInt(match[2], 10);
            if (prevRef.verse !== undefined) {
              // If previous reference had a verse, a single number is a verse in the same chapter
              nextVerse = match[2];
              verseText = match[2];
            } else {
              // If previous reference had no verse, a single number is a new chapter
              nextChapter = num;
              nextVerse = undefined;
            }
          }

          const sameBook = (nextBook === prevRef.book);
          const sameChapter = (sameBook && nextChapter === prevRef.chapter);
          const hasSemicolon = separatorChar === ";" || prefix.includes(";");
          const hasComma = separatorChar === "," || prefix.includes(",");
          const hasConjunction = /\b(and|or)\b/i.test(prefix) || /\b(and|or)\b/i.test(matchedString);

          // Construct correct/expected prefix and citation
          const conjMatch = prefix.match(/\b(and|or)\b/i);
          const conj = conjMatch ? conjMatch[1] : "";
          const hasSeparatorInOriginal = prefix.includes(",") || prefix.includes(";");
          const expectedSeparator = sameChapter ? "," : ";";

          let expectedPrefix = "";
          if (hasSeparatorInOriginal) {
            if (conj) {
              expectedPrefix = `${expectedSeparator} ${conj} `;
            } else {
              expectedPrefix = `${expectedSeparator} `;
            }
          } else {
            if (conj) {
              expectedPrefix = ` ${conj} `;
            } else {
              expectedPrefix = `${expectedSeparator} `;
            }
          }

          let expectedCitation = "";
          if (sameBook) {
            if (sameChapter) {
              if (nextVerse !== undefined) {
                expectedCitation = verseText;
              } else {
                expectedCitation = String(nextChapter);
              }
            } else {
              if (nextVerse !== undefined) {
                expectedCitation = `${nextChapter}:${verseText}`;
              } else {
                expectedCitation = String(nextChapter);
              }
            }
          } else {
            const rawBook = matchedType === "book" ? match[2] : prevRef.book;
            if (nextVerse !== undefined) {
              expectedCitation = `${rawBook} ${nextChapter}:${verseText}`;
            } else {
              expectedCitation = `${rawBook} ${nextChapter}`;
            }
          }

          const expectedText = expectedPrefix + expectedCitation;

          // Determine specific violation message type if mismatch
          if (matchedString !== expectedText) {
            let message = "Incorrect formatting in consecutive Bible references";
            let severity: "error" | "warning" = "error";

            if (matchedType === "book" && sameBook) {
              message = "Redundant book name in consecutive Bible references";
            } else if (sameChapter && (matchedType === "book" || matchedType === "chapter-verse") && matchedString.includes(String(nextChapter))) {
              message = "Redundant chapter number in consecutive Bible references";
            } else if (sameChapter && hasSemicolon) {
              message = "Incorrect separator in consecutive Bible references: use a comma to separate references within the same chapter";
            } else if (!sameChapter && hasComma && !hasSemicolon && !hasConjunction) {
              message = "Incorrect separator in consecutive Bible references: use a semicolon to separate references in different chapters/books";
            } else if (!hasSeparatorInOriginal && !hasConjunction) {
              message = "Missing separator between consecutive Bible references";
            }

            violations.push({
              ruleId: bibleConsecutiveRefsRule.id,
              ruleName: bibleConsecutiveRefsRule.name,
              severity,
              message,
              paragraphIndex: pIndex,
              region,
              detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
              correction: {
                found: matchedString,
                expected: expectedText
              },
              paragraphSnippet: getParagraphSnippet(text)
            });
          }

          // Move to next
          prevRef = {
            book: nextBook,
            chapter: nextChapter,
            verse: nextVerse,
            text: matchedString.substring(matchedString.indexOf(match[2] || match[1] || matchedString.trim())),
            startIndex: matchStart,
            endIndex: matchEnd
          };
          scanIndex = matchEnd;
        }

        // Advance start regex past the scanned citation block to avoid double matching
        CITATION_START_REGEX.lastIndex = scanIndex;
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
export default bibleConsecutiveRefsRule;

