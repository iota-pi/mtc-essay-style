import { describe, it, expect } from "vitest";
import { createTestParagraph, createTestDocument, createTestContext } from "./test-utils.js";
import { DocumentSections } from "../src/analysis/sections.js";
import { lineSpacingRule } from "../src/rules/definitions/line-spacing.js";

describe("Rule 7: Double Line Spacing", () => {
  it("should flag paragraph that is not double line spacing", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("This is body paragraph.", {
          properties: { lineSpacing: { line: 240, lineRule: "auto" } }
        })
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
    const violations = lineSpacingRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain("does not use double line spacing");
  });

  it("should pass when paragraph has 480 twips line spacing", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("This is body paragraph.", {
          properties: { lineSpacing: { line: 480, lineRule: "auto" } }
        })
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
    const violations = lineSpacingRule.check(context);

    expect(violations.length).toBe(0);
  });

  it("should pass when paragraph has undefined line spacing but Normal style defines double spacing", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("This paragraph has no direct spacing, it inherits Normal style spacing.")
      ],
      styles: new Map([
        [
          "Normal",
          {
            styleId: "Normal",
            name: "Normal",
            type: "paragraph",
            paragraphProperties: { lineSpacing: { line: 480, lineRule: "auto" } }
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
    const violations = lineSpacingRule.check(context);

    expect(violations.length).toBe(0);
  });

  it("should skip headings and bibliography", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("Chapter Title", {
          properties: { outlineLevel: 1, lineSpacing: { line: 240 } }
        })
      ]
    });
    const sections: DocumentSections = {
      titlePage: [],
      body: [],
      bibliography: doc.paragraphs,
      hasTitlePage: false,
      hasBibliography: true
    };
    const context = createTestContext(doc, sections);
    const violations = lineSpacingRule.check(context);

    expect(violations.length).toBe(0);
  });
});
