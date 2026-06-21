import { StyleRule, StyleViolation } from "../types.js";
import { getParagraphText, findParagraphIndex, getRegionForParagraph, isSentenceStart, getParagraphSnippet } from "../utils.js";
import { DocumentRegion } from "../../analysis/sections.js";

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
            ruleId: abbreviationStyleRule.id,
            ruleName: abbreviationStyleRule.name,
            severity: "error",
            message: "Incorrect punctuation or capitalisation for abbreviation 'e.g.'",
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
            correction: {
              found: raw,
              expected: correct
            },
            paragraphSnippet: getParagraphSnippet(text)
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
            ruleId: abbreviationStyleRule.id,
            ruleName: abbreviationStyleRule.name,
            severity: "error",
            message: "Incorrect punctuation or capitalisation for abbreviation 'i.e.'",
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
            correction: {
              found: raw,
              expected: correct
            },
            paragraphSnippet: getParagraphSnippet(text)
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
            ruleId: abbreviationStyleRule.id,
            ruleName: abbreviationStyleRule.name,
            severity: "error",
            message: "Incorrect punctuation or capitalisation for abbreviation 'cf.'",
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
            correction: {
              found: raw,
              expected: correct
            },
            paragraphSnippet: getParagraphSnippet(text)
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
            ruleId: abbreviationStyleRule.id,
            ruleName: abbreviationStyleRule.name,
            severity: "error",
            message: "Incorrect punctuation or capitalisation for abbreviation 'et al.'",
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
            correction: {
              found: raw,
              expected: correct
            },
            paragraphSnippet: getParagraphSnippet(text)
          });
        }
      }

      // 5. etc. check
      etcRegex.lastIndex = 0;
      while ((match = etcRegex.exec(text)) !== null) {
        const raw = match[0];
        if (raw !== "etc.") {
          violations.push({
            ruleId: abbreviationStyleRule.id,
            ruleName: abbreviationStyleRule.name,
            severity: "error",
            message: "Incorrect punctuation for abbreviation 'etc.'",
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
            correction: {
              found: raw,
              expected: "etc."
            },
            paragraphSnippet: getParagraphSnippet(text)
          });
        }
      }

      // 6. viz. check
      vizRegex.lastIndex = 0;
      while ((match = vizRegex.exec(text)) !== null) {
        const raw = match[0];
        if (raw !== "viz.") {
          violations.push({
            ruleId: abbreviationStyleRule.id,
            ruleName: abbreviationStyleRule.name,
            severity: "error",
            message: "Incorrect punctuation for abbreviation 'viz.'",
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
            correction: {
              found: raw,
              expected: "viz."
            },
            paragraphSnippet: getParagraphSnippet(text)
          });
        }
      }

      // 7. ca. check
      caRegex.lastIndex = 0;
      while ((match = caRegex.exec(text)) !== null) {
        const raw = match[0]; // e.g. "ca 1500"
        const correct = raw.startsWith("Ca") ? "Ca." + raw.substring(2) : "ca." + raw.substring(2);
        violations.push({
          ruleId: abbreviationStyleRule.id,
          ruleName: abbreviationStyleRule.name,
          severity: "error",
          message: "Incorrect punctuation for abbreviation 'ca.'",
          paragraphIndex: pIndex,
          region,
          detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
          correction: {
            found: raw,
            expected: correct
          },
          paragraphSnippet: getParagraphSnippet(text)
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

