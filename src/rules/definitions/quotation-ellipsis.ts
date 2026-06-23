import { StyleRule, StyleViolation } from "../types.js";
import { getParagraphText, findParagraphIndex, getRegionForParagraph, getParagraphSnippet } from "../utils.js";
import { DocumentRegion } from "../../analysis/sections.js";

export const quotationEllipsisRule: StyleRule = {
  id: "sbl-quotation-ellipsis",
  name: "Quotation Ellipsis Spacing",
  description: "Enforces that an ellipsis inside quotation marks must have a space immediately before and after it.",
  scope: ["body", "footnote"],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = [];
    const doc = context.document;
    const sections = context.sections;

    const processText = (
      text: string,
      pIndex: number | undefined,
      region: DocumentRegion | undefined,
      footnoteId?: string
    ) => {
      if (region === "title-page" || region === "bibliography") {
        return;
      }

      // Build insideQuotes map
      const insideQuotes = new Array(text.length).fill(false);
      let doubleQuoteOpen = false;
      let singleQuoteOpen = false;

      for (let idx = 0; idx < text.length; idx++) {
        const c = text[idx];
        
        if (c === '“') {
          doubleQuoteOpen = true;
        } else if (c === '”') {
          doubleQuoteOpen = false;
        } else if (c === '‘') {
          singleQuoteOpen = true;
        } else if (c === '’') {
          const isApostrophe = (idx > 0 && /\w/.test(text[idx-1])) && (idx < text.length - 1 && /\w/.test(text[idx+1]));
          if (!isApostrophe) {
            singleQuoteOpen = false;
          }
        } else if (c === '"') {
          doubleQuoteOpen = !doubleQuoteOpen;
        } else if (c === '\'') {
          const isApostrophe = (idx > 0 && /\w/.test(text[idx-1])) && (idx < text.length - 1 && /\w/.test(text[idx+1]));
          if (!isApostrophe) {
            singleQuoteOpen = !singleQuoteOpen;
          }
        }
        
        insideQuotes[idx] = doubleQuoteOpen || singleQuoteOpen;
      }

      // Find ellipses
      const ellipsisRegex = /(…|\.{3})/g;
      let match;

      while ((match = ellipsisRegex.exec(text)) !== null) {
        const matchedEllipsis = match[0];
        const matchIndex = match.index;

        if (insideQuotes[matchIndex]) {
          const beforeOk = matchIndex > 0 && /\s/.test(text[matchIndex - 1]);
          const afterOk = matchIndex + matchedEllipsis.length < text.length && /\s/.test(text[matchIndex + matchedEllipsis.length]);

          if (!beforeOk || !afterOk) {
            // Find snippet around match for details/correction
            const startIdx = Math.max(0, matchIndex - 5);
            const endIdx = Math.min(text.length, matchIndex + matchedEllipsis.length + 5);
            const foundText = text.substring(startIdx, endIdx);
            
            // Generate correction
            const leftPart = text.substring(startIdx, matchIndex);
            const rightPart = text.substring(matchIndex + matchedEllipsis.length, endIdx);
            const expectedText = `${leftPart.trimEnd()} … ${rightPart.trimStart()}`;

            violations.push({
              ruleId: "sbl-quotation-ellipsis",
              ruleName: "Quotation Ellipsis Spacing",
              severity: "error",
              message: `Ellipsis "${matchedEllipsis}" inside quotation marks must have a space immediately before and after it.`,
              paragraphIndex: pIndex,
              region,
              detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
              correction: {
                found: foundText,
                expected: expectedText
              },
              paragraphSnippet: getParagraphSnippet(text)
            });
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
export default quotationEllipsisRule;
