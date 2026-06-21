import { StyleRule, StyleViolation } from "../types.js";
import { getParagraphText, isHeading, findParagraphIndex } from "../utils.js";

export const lineSpacingRule: StyleRule = {
  id: "format-line-spacing",
  name: "Double Line Spacing",
  description: "Verifies that body text paragraphs use double line spacing (480 twips, auto spacing).",
  scope: ["body"],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = [];
    const doc = context.document;
    const sections = context.sections;

    // We only check body paragraphs
    const bodyParagraphs = sections.body;

    for (const para of bodyParagraphs) {
      // Skip empty paragraphs (blank lines)
      if (getParagraphText(para).trim() === "") {
        continue;
      }

      // Skip headings
      if (isHeading(para, context)) {
        continue;
      }

      const resolved = context.resolveParagraphProperties(para);
      const spacing = resolved.lineSpacing;
      
      // Double line spacing is 480 twips with "auto" rule (or undefined which defaults to auto in Word)
      let hasDoubleSpacing = spacing && 
        spacing.line === 480 && 
        (spacing.lineRule === "auto" || spacing.lineRule === undefined);

      if (!hasDoubleSpacing && (!spacing || spacing.line === undefined)) {
        const defaultSpacing = doc.defaultParagraphProperties?.lineSpacing ||
                               doc.styles.get("Normal")?.paragraphProperties?.lineSpacing ||
                               doc.styles.get("normal")?.paragraphProperties?.lineSpacing;
        
        if (defaultSpacing && defaultSpacing.line === 480 && (defaultSpacing.lineRule === "auto" || defaultSpacing.lineRule === undefined)) {
          hasDoubleSpacing = true;
        }
      }

      if (!hasDoubleSpacing) {
        const pIndex = findParagraphIndex(para, doc);
        const actualLine = spacing?.line;
        const actualRule = spacing?.lineRule || "auto";
        const actualText = getParagraphText(para);
        const snippet = actualText.length > 50 ? actualText.substring(0, 50) + "..." : actualText;

        violations.push({
          ruleId: this.id,
          ruleName: this.name,
          severity: "error",
          message: `Paragraph does not use double line spacing. Found line height ${actualLine !== undefined ? actualLine : "default"} (rule: ${actualRule}) instead of 480 twips (auto).`,
          paragraphIndex: pIndex,
          region: "body",
          detail: `Snippet: "${snippet}"`
        });
      }
    }

    return violations;
  }
};
export default lineSpacingRule;
