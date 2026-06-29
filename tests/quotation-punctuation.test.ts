import { describe, it, expect } from "vitest";
import { createTestParagraph, createTestDocument, createTestContext } from "./test-utils";
import { DocumentSections } from "../src/analysis/sections";
import { quotationPunctuationRule } from "../src/rules/definitions/quotation-punctuation";

describe("Rule 5: Quotation Mark and Citation Punctuation", () => {
  it.each([
    { text: 'She said "yes", but he said no.', found: '","' },
    { text: 'He said "no".', found: '"."' }
  ])("should flag punctuation outside quotes in '$text'", ({ text, found }) => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph(text)]
    });
    const sections: DocumentSections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = quotationPunctuationRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain(found);
  });

  it.each([
    { text: 'He wrote "scripture;" and nothing else.', found: '";"' },
    { text: 'He wrote "command:" and nothing else.', found: '":"' }
  ])("should flag semicolons or colons inside quotes in '$text'", ({ text, found }) => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph(text)]
    });
    const sections: DocumentSections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = quotationPunctuationRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain(found);
  });

  it("should flag footnote reference placed before punctuation", () => {
    const doc = createTestDocument({
      paragraphs: [
        {
          runs: [
            { text: 'A quote"', properties: {} },
            { text: "", properties: {}, footnoteId: "1" },
            { text: ".", properties: {} }
          ],
          properties: {},
          hasPageBreakBefore: false,
          hasImage: false,
          footnoteRefs: [1]
        }
      ]
    });
    const sections: DocumentSections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = quotationPunctuationRule.check(context);

    expect(violations.length).toBe(2);
    // Find the footnote violation
    const fnViolation = violations.find(v => v.message.includes("Footnote reference"));
    expect(fnViolation).toBeDefined();
    expect(fnViolation!.message).toContain('before punctuation/closing quotes "."');
  });

  it("should pass correct quote and footnote placements", () => {
    const doc = createTestDocument({
      paragraphs: [
        {
          runs: [
            { text: 'A quote."', properties: {} },
            { text: "", properties: {}, footnoteId: "1" }
          ],
          properties: {},
          hasPageBreakBefore: false,
          hasImage: false,
          footnoteRefs: [1]
        }
      ]
    });
    const sections: DocumentSections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = quotationPunctuationRule.check(context);

    expect(violations.length).toBe(0);
  });
});
