import { describe, it, expect } from "vitest";
import { createTestParagraph, createTestDocument, createTestContext } from "./test-utils.js";
import { DocumentSections } from "../src/analysis/sections.js";
import { fontSizeRule } from "../src/rules/definitions/font-size.js";

describe("Rule 8: Font Size 12pt", () => {
  it("should flag runs that are not size 12pt (fontSize 24)", () => {
    const doc = createTestDocument({
      paragraphs: [
        {
          runs: [{ text: "Wrong size run.", properties: { fontSize: 20 } }], // 10pt
          properties: {},
          hasPageBreakBefore: false,
          hasImage: false,
          footnoteRefs: []
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
    const violations = fontSizeRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain("not 12pt");
  });

  it("should report and abridge the specific text which is not the right size", () => {
    const doc = createTestDocument({
      paragraphs: [
        {
          runs: [
            { text: "This is a very long paragraph that has a portion of text that is not the right size.", properties: { fontSize: 24 } },
            { text: "This part is incorrectly sized and is longer than twenty five characters.", properties: { fontSize: 20 } },
            { text: " This part is back to correct size.", properties: { fontSize: 24 } }
          ],
          properties: {},
          hasPageBreakBefore: false,
          hasImage: false,
          footnoteRefs: []
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
    const violations = fontSizeRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain('Paragraph contains text that is not 12pt: "This part is incorrectly..." (10pt). All body text must be exactly 12pt.');
  });

  it("should pass runs that are exactly size 12pt (fontSize 24)", () => {
    const doc = createTestDocument({
      paragraphs: [
        {
          runs: [{ text: "Correct size run.", properties: { fontSize: 24 } }],
          properties: {},
          hasPageBreakBefore: false,
          hasImage: false,
          footnoteRefs: []
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
    const violations = fontSizeRule.check(context);

    expect(violations.length).toBe(0);
  });

  it("should pass runs that are undefined but Normal style defines size 12pt (fontSize 24)", () => {
    const doc = createTestDocument({
      paragraphs: [
        {
          runs: [{ text: "Default size run.", properties: {} }],
          properties: {},
          hasPageBreakBefore: false,
          hasImage: false,
          footnoteRefs: []
        }
      ],
      styles: new Map([
        [
          "Normal",
          {
            styleId: "Normal",
            name: "Normal",
            type: "paragraph",
            runProperties: { fontSize: 24 }
          }
        ]
      ])
    });
    const sections: DocumentSections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = fontSizeRule.check(context);

    expect(violations.length).toBe(0);
  });
});
