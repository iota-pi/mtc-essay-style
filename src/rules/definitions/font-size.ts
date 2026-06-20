import { StyleRule, StyleViolation } from "../types.js";
import { getParagraphText, isHeading, findParagraphIndex } from "../utils.js";

export const fontSizeRule: StyleRule = {
  id: "format-font-size",
  name: "Font Size 12pt",
  description: "Verifies that body text paragraphs use exactly 12pt font size.",
  scope: ["body"],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = [];
    const doc = context.document;
    const sections = context.sections;

    const bodyParagraphs = sections.body;

    for (const para of bodyParagraphs) {
      // Skip empty paragraphs
      if (getParagraphText(para).trim() === "") {
        continue;
      }

      // Skip headings
      if (isHeading(para, context)) {
        continue;
      }

      const nonCompliantSizes = new Set<number>();
      
      for (const run of para.runs) {
        // Skip empty or purely whitespace runs
        if (run.text.trim() === "") {
          continue;
        }

        // Skip footnote references (they are typically superscript/smaller)
        if (run.footnoteId !== undefined) {
          continue;
        }

        const resolved = context.resolveRunProperties(run, para);
        const size = resolved.fontSize; // in half-points (24 = 12pt)

        if (size !== 24) {
          nonCompliantSizes.add(size !== undefined ? size / 2 : 0);
        }
      }

      if (nonCompliantSizes.size > 0) {
        const pIndex = findParagraphIndex(para, doc);
        const sizesStr = Array.from(nonCompliantSizes)
          .map(s => (s === 0 ? "default" : `${s}pt`))
          .join(", ");
        const actualText = getParagraphText(para);
        const snippet = actualText.length > 50 ? actualText.substring(0, 50) + "..." : actualText;

        violations.push({
          ruleId: this.id,
          ruleName: this.name,
          severity: "error",
          message: `Paragraph contains text that is not 12pt (found: ${sizesStr}). All body text must be exactly 12pt.`,
          paragraphIndex: pIndex,
          region: "body",
          detail: `Snippet: "${snippet}"`
        });
      }
    }

    return violations;
  }
};
export default fontSizeRule;
