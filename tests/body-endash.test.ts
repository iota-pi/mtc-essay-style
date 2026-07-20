import { describe, it, expect } from "vitest";
import { createTestParagraph, createTestDocument, createTestContext } from "./test-utils";
import { DocumentSections } from "../src/analysis/sections";
import { bodyEndashRule } from "../src/rules/definitions/body-endash";

describe("Rule 11: Body Text En-dash Check", () => {
  it("should flag en-dash used outside number ranges in body", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("This is body text – with an endash.")]
    });
    const sections: DocumentSections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = bodyEndashRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].severity).toBe("warning");
    expect(violations[0].message).toContain("En-dash (–) used incorrectly");
  });

  it("should pass en-dash used between numbers", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("The years 1914–1918 were historical. Read Gen 1:1–5.")
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
    const violations = bodyEndashRule.check(context);

    expect(violations.length).toBe(0);
  });

  it("should flag hyphens in general digit ranges in the body", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("See page 12-15 for more details. We lived there in 1990-1995.")
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
    const violations = bodyEndashRule.check(context);

    expect(violations.length).toBe(2);
    expect(violations[0].message).toContain("Use an en-dash (–) instead of a hyphen (-)");
    expect(violations[0].correction?.found).toBe("12-15");
    expect(violations[0].correction?.expected).toBe("12–15");
    expect(violations[1].correction?.found).toBe("1990-1995");
    expect(violations[1].correction?.expected).toBe("1990–1995");
  });

  it("should flag hyphens in general digit ranges in footnotes and bibliographies", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("Citation text in bibliography.")
      ],
      footnotes: [
        {
          id: 1,
          paragraphs: [createTestParagraph("See pages 102 - 110.")]
        }
      ]
    });
    const sections: DocumentSections = {
      titlePage: [],
      body: [],
      bibliography: doc.paragraphs, // Mark the body paragraph as bibliography
      hasTitlePage: false,
      hasBibliography: true
    };
    const context = createTestContext(doc, sections);
    const violations = bodyEndashRule.check(context);

    // One footnote violation
    expect(violations.length).toBe(1);
    expect(violations[0].region).toBe("footnote");
    expect(violations[0].correction?.found).toBe("102 - 110");
    expect(violations[0].correction?.expected).toBe("102–110");
  });

  it("should ignore Bible reference ranges with hyphens", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("In Gen 1:1-3 we see the beginning. And in 1 Cor 13:1-14:3.")
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
    const violations = bodyEndashRule.check(context);

    // Handled by bible-range-endash rule, so this rule should skip them
    expect(violations.length).toBe(0);
  });

  it("should ignore ISBNs and phone numbers", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("The ISBN is 978-3-16-148410-0. Call us at 1-800-555-0199.")
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
    const violations = bodyEndashRule.check(context);

    expect(violations.length).toBe(0);
  });
});
