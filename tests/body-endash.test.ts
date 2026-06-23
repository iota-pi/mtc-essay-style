import { describe, it, expect } from "vitest";
import { createTestParagraph, createTestDocument, createTestContext } from "./test-utils.js";
import { DocumentSections } from "../src/analysis/sections.js";
import { bodyEndashRule } from "../src/rules/definitions/body-endash.js";

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
});
