import { describe, it, expect } from "vitest";
import { createTestParagraph, createTestDocument, createTestContext } from "./test-utils";
import { DocumentSections } from "../src/analysis/sections";
import { bibleRefFormatRule } from "../src/rules/definitions/bible-ref-format";

describe("Rule 2: Bible Reference Format", () => {
  it.each([
    { citation: "Gen1:1", found: "Gen1", expected: "Gen 1" },
    { citation: "1Cor13:4", found: "1Cor13", expected: "1 Cor 13" }
  ])("should flag missing space in $citation", ({ citation, found, expected }) => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph(`Scripture tells us in ${citation}.`)]
    });
    const sections: DocumentSections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = bibleRefFormatRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toBe("Missing space in Bible reference");
    expect(violations[0].correction?.found).toBe(found);
    expect(violations[0].correction?.expected).toBe(expected);
  });

  it.each([
    { text: "Read Gen ch. 1.", found: "Gen ch. 1", expected: "Gen 1", message: "Do not use 'ch.' or 'chapter' in Bible citations" },
    { text: "Read Matt 5:3, v. 4.", found: "Matt 5:3, v. 4", expected: "Matt 5:3, 4", message: "Do not use 'v.', 'verse', 'vv.', or 'verses' in Bible citations" }
  ])("should flag reference terms in '$text'", ({ text, found, expected, message }) => {
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
    const violations = bibleRefFormatRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toBe(message);
    expect(violations[0].correction?.found).toBe(found);
    expect(violations[0].correction?.expected).toBe(expected);
  });

  it("should pass correctly formatted citations", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("Correct citations are Gen 1.1, Gen 1:1, and Matt 5:3–7.")
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
    const violations = bibleRefFormatRule.check(context);

    expect(violations.length).toBe(0);
  });
});
