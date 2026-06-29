import { describe, it, expect } from "vitest";
import { createTestParagraph, createTestDocument, createTestContext } from "./test-utils";
import { DocumentSections } from "../src/analysis/sections";
import { bibleRangeEndashRule } from "../src/rules/definitions/bible-range-endash";

describe("Rule 10: Bible Range Dash Check", () => {
  it.each([
    { text: "Read Gen 1:1-3.", found: "Gen 1:1-3", expected: "Gen 1:1–3" },
    { text: "Read Gen 1-2.", found: "Gen 1-2", expected: "Gen 1–2" }
  ])("should flag hyphens in range in '$text'", ({ text, found, expected }) => {
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
    const violations = bibleRangeEndashRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toBe("Use an en-dash (–) instead of a hyphen (-) for ranges in Bible references");
    expect(violations[0].correction?.found).toBe(found);
    expect(violations[0].correction?.expected).toBe(expected);
  });

  it("should pass when en-dash is used in ranges", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("Read Gen 1:1–3 and Gen 1–2.")]
    });
    const sections: DocumentSections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = bibleRangeEndashRule.check(context);

    expect(violations.length).toBe(0);
  });
});
