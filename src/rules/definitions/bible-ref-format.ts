import { StyleRule, StyleViolation } from "../types.js";
import { SBL_VALID_ABBREVIATIONS, SBL_BOOK_MAP, COMMON_WRONG_ABBREVIATIONS } from "../data/sbl-books.js";
import { getParagraphText, findParagraphIndex, getRegionForParagraph } from "../utils.js";

// List of all book keys for checking
const ALL_BOOK_NAMES = Array.from(SBL_BOOK_MAP.keys())
  .concat(Array.from(SBL_VALID_ABBREVIATIONS).map(s => s.toLowerCase()))
  .concat(Array.from(COMMON_WRONG_ABBREVIATIONS.keys()))
  .sort((a, b) => b.length - a.length);

const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const bookAlternation = sortedNamesPattern(ALL_BOOK_NAMES);

function sortedNamesPattern(names: string[]): string {
  return names.map(name => escapeRegExp(name)).join("|");
}

export const bibleRefFormatRule: StyleRule = {
  id: "sbl-bible-ref-format",
  name: "Bible Reference Format",
  description: "Checks that biblical references are formatted correctly, including spaces, range indicators (en-dash), and the exclusion of 'ch.' or 'v.' in citations.",
  scope: ["body", "footnote"],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = [];
    const doc = context.document;
    const sections = context.sections;

    // 1. Missing space regex, e.g. Gen1:1 or 1Cor13:1
    // Matches a book name immediately followed by a digit
    const missingSpaceRegex = new RegExp(`\\b(${bookAlternation})(\\d+)`, "gi");

    // 2. ch./v./vv. usage in citation
    // e.g., Gen ch. 1, Gen 1 v. 3, Gen 1:1 v. 3, Gen 1 vv. 3-4, Gen chapter 1
    const chUsageRegex = new RegExp(`\\b(${bookAlternation})\\s+(?:ch\\.?|chapter)\\s+\\d+`, "gi");
    const vUsageRegex = new RegExp(`\\b(${bookAlternation})\\s+\\d+(?:[.:]\\d+)?(?:\\s*,)?\\s+(?:v\\.?|verse|vv\\.?|verses)\\s+\\d+`, "gi");


    // Process paragraphs
    for (const para of doc.paragraphs) {
      const text = getParagraphText(para);
      const pIndex = findParagraphIndex(para, doc);
      const region = getRegionForParagraph(para, sections);

      // Only check body paragraphs and footnotes (since scope is ["body", "footnote"], but let's exclude title/bib if they are body)
      if (region === "title-page" || region === "bibliography") {
        continue;
      }

      // Check missing space
      missingSpaceRegex.lastIndex = 0;
      let match;
      while ((match = missingSpaceRegex.exec(text)) !== null) {
        const fullMatch = match[0];
        const book = match[1];
        const num = match[2];
        violations.push({
          ruleId: this.id,
          ruleName: this.name,
          severity: "error",
          message: `Missing space in Bible reference "${fullMatch}". There should be a space between the book name and the chapter number (e.g., "${book} ${num}").`,
          paragraphIndex: pIndex,
          region,
          detail: `Matched text: "${fullMatch}"`
        });
      }

      // Check ch. usage
      chUsageRegex.lastIndex = 0;
      while ((match = chUsageRegex.exec(text)) !== null) {
        const fullMatch = match[0];
        violations.push({
          ruleId: this.id,
          ruleName: this.name,
          severity: "error",
          message: `Do not use "ch." or "chapter" in citations (found "${fullMatch}"). SBL style requires citations to be formatted as numbers only (e.g., "Gen 1").`,
          paragraphIndex: pIndex,
          region,
          detail: `Matched text: "${fullMatch}"`
        });
      }

      // Check v. / vv. usage
      vUsageRegex.lastIndex = 0;
      while ((match = vUsageRegex.exec(text)) !== null) {
        const fullMatch = match[0];
        violations.push({
          ruleId: this.id,
          ruleName: this.name,
          severity: "error",
          message: `Do not use "v.", "verse", "vv.", or "verses" in citations (found "${fullMatch}"). SBL style requires citations to be formatted as numbers only (e.g., "Gen 1:3").`,
          paragraphIndex: pIndex,
          region,
          detail: `Matched text: "${fullMatch}"`
        });
      }

    }

    // Process footnotes
    for (const footnote of doc.footnotes) {
      for (const para of footnote.paragraphs) {
        const text = getParagraphText(para);

        // Check missing space
        missingSpaceRegex.lastIndex = 0;
        let match;
        while ((match = missingSpaceRegex.exec(text)) !== null) {
          const fullMatch = match[0];
          const book = match[1];
          const num = match[2];
          violations.push({
            ruleId: this.id,
            ruleName: this.name,
            severity: "error",
            message: `Missing space in Bible reference "${fullMatch}". There should be a space between the book name and the chapter number (e.g., "${book} ${num}").`,
            region: undefined,
            detail: `Footnote ID: ${footnote.id}, Matched text: "${fullMatch}"`
          });
        }

        // Check ch. usage
        chUsageRegex.lastIndex = 0;
        while ((match = chUsageRegex.exec(text)) !== null) {
          const fullMatch = match[0];
          violations.push({
            ruleId: this.id,
            ruleName: this.name,
            severity: "error",
            message: `Do not use "ch." or "chapter" in citations (found "${fullMatch}"). SBL style requires citations to be formatted as numbers only (e.g., "Gen 1").`,
            region: undefined,
            detail: `Footnote ID: ${footnote.id}, Matched text: "${fullMatch}"`
          });
        }

        // Check v. / vv. usage
        vUsageRegex.lastIndex = 0;
        while ((match = vUsageRegex.exec(text)) !== null) {
          const fullMatch = match[0];
          violations.push({
            ruleId: this.id,
            ruleName: this.name,
            severity: "error",
            message: `Do not use "v.", "verse", "vv.", or "verses" in citations (found "${fullMatch}"). SBL style requires citations to be formatted as numbers only (e.g., "Gen 1:3").`,
            region: undefined,
            detail: `Footnote ID: ${footnote.id}, Matched text: "${fullMatch}"`
          });
        }

      }
    }

    return violations;
  }
};
export default bibleRefFormatRule;
