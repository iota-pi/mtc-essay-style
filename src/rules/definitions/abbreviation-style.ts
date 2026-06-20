import { StyleRule, StyleViolation } from "../types.js";
import { getParagraphText, findParagraphIndex, getRegionForParagraph } from "../utils.js";
import { DocumentRegion } from "../../analysis/sections.js";

// Helper to check if a match is at the start of a sentence
function isSentenceStart(text: string, index: number): boolean {
  if (index === 0) return true;
  const preceding = text.substring(Math.max(0, index - 4), index);
  return /[.!?]\s+$/.test(preceding) || /[.!?]"\s+$/.test(preceding) || /[.!?]'\s+$/.test(preceding);
}

export const abbreviationStyleRule: StyleRule = {
  id: "sbl-abbreviation-style",
  name: "Abbreviation Punctuation and Capitalisation",
  description: "Checks that academic abbreviations (e.g., i.e., cf., et al., etc.) are punctuated and capitalised correctly.",
  scope: ["body", "footnote"],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = [];
    const doc = context.document;
    const sections = context.sections;

    // Regexes to capture variant abbreviations
    const egRegex = /\b(e\s*\.?\s*g\s*\.?,?)/gi;
    const ieRegex = /\b(i\s*\.?\s*e\s*\.?,?)/gi;
    const cfRegex = /\b(c\s*\.?\s*f\s*\.?,?)/gi;
    const etalRegex = /\b(et\s*\.?\s*al\s*\.?,?)/gi;
    const etcRegex = /\b(etc\b\.?)/gi;
    const vizRegex = /\b(viz\b\.?)/gi;
    const caRegex = /\bca\b(?:\s+\d+)/gi; // ca followed by space and digit

    const processText = (text: string, pIndex: number | undefined, region: DocumentRegion | undefined, footnoteId?: string) => {
      if (region === "title-page" || region === "bibliography") {
        return;
      }

      let match;

      // 1. e.g. check
      egRegex.lastIndex = 0;
      while ((match = egRegex.exec(text)) !== null) {
        const raw = match[0];
        const index = match.index;
        const atSentenceStart = isSentenceStart(text, index);
        const correct = atSentenceStart ? "E.g.," : "e.g.,";
        
        if (raw !== correct) {
          violations.push({
            ruleId: this.id,
            ruleName: this.name,
            severity: "error",
            message: `Incorrect form of "e.g." found: "${raw}". Correct academic form is "${correct}" (lowercase, punctuated with periods, and followed by a comma).`,
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined
          });
        }
      }

      // 2. i.e. check
      ieRegex.lastIndex = 0;
      while ((match = ieRegex.exec(text)) !== null) {
        const raw = match[0];
        const index = match.index;
        const atSentenceStart = isSentenceStart(text, index);
        const correct = atSentenceStart ? "I.e.," : "i.e.,";
        
        if (raw !== correct) {
          violations.push({
            ruleId: this.id,
            ruleName: this.name,
            severity: "error",
            message: `Incorrect form of "i.e." found: "${raw}". Correct academic form is "${correct}" (lowercase, punctuated with periods, and followed by a comma).`,
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined
          });
        }
      }

      // 3. cf. check
      cfRegex.lastIndex = 0;
      while ((match = cfRegex.exec(text)) !== null) {
        const raw = match[0];
        const index = match.index;
        const atSentenceStart = isSentenceStart(text, index);
        const correct = atSentenceStart ? "Cf." : "cf.";
        
        if (raw !== correct) {
          violations.push({
            ruleId: this.id,
            ruleName: this.name,
            severity: "error",
            message: `Incorrect form of "cf." found: "${raw}". Correct form is "${correct}" (lowercase with a period).`,
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined
          });
        }
      }

      // 4. et al. check
      etalRegex.lastIndex = 0;
      while ((match = etalRegex.exec(text)) !== null) {
        const raw = match[0];
        const correct = "et al.";
        
        if (raw !== correct) {
          violations.push({
            ruleId: this.id,
            ruleName: this.name,
            severity: "error",
            message: `Incorrect form of "et al." found: "${raw}". SBL style requires "et al." (no period after "et", period after "al").`,
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined
          });
        }
      }

      // 5. etc. check
      etcRegex.lastIndex = 0;
      while ((match = etcRegex.exec(text)) !== null) {
        const raw = match[0];
        if (raw !== "etc.") {
          violations.push({
            ruleId: this.id,
            ruleName: this.name,
            severity: "error",
            message: `Incorrect form of "etc." found: "${raw}". Must be "etc." with a period.`,
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined
          });
        }
      }

      // 6. viz. check
      vizRegex.lastIndex = 0;
      while ((match = vizRegex.exec(text)) !== null) {
        const raw = match[0];
        if (raw !== "viz.") {
          violations.push({
            ruleId: this.id,
            ruleName: this.name,
            severity: "error",
            message: `Incorrect form of "viz." found: "${raw}". Must be "viz." with a period.`,
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined
          });
        }
      }

      // 7. ca. check
      caRegex.lastIndex = 0;
      while ((match = caRegex.exec(text)) !== null) {
        const raw = match[0]; // e.g. "ca 1500"
        violations.push({
          ruleId: this.id,
          ruleName: this.name,
          severity: "error",
          message: `Incorrect form of "ca." (circa) found in "${raw}". SBL style requires "ca." with a period (e.g., "ca. 1500").`,
          paragraphIndex: pIndex,
          region,
          detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined
        });
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
export default abbreviationStyleRule;
