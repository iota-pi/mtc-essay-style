import { describe, it, expect } from "vitest";
import { createTestParagraph, createTestDocument, createTestContext } from "./test-utils.js";
import { DocumentSections } from "../src/analysis/sections.js";
import { bibleBookAbbreviationsRule } from "../src/rules/definitions/bible-book-abbreviations.js";

describe("Rule 3: Bible Book Name Abbreviations", () => {
  it.each([
    { text: "Look at (Gen. 1:1).", found: "Gen. 1:1", expected: "Gen 1:1", message: "Use SBL book abbreviation inside parentheses" },
    { text: "Look at Matt. 5:3.", found: "Matt. 5:3", expected: "Matt 5:3", message: "Use SBL book abbreviation in running text when cited with chapter/verse" }
  ])("should flag book abbreviation with trailing period in '$text'", ({ text, found, expected, message }) => {
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
    const violations = bibleBookAbbreviationsRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toBe(message);
    expect(violations[0].correction?.found).toBe(found);
    expect(violations[0].correction?.expected).toBe(expected);
  });

  it.each([
    { text: "See (Ex 20:1).", found: "Ex 20:1", expected: "Exod 20:1", message: "Use SBL book abbreviation inside parentheses" },
    { text: "See Mk 1:1.", found: "Mk 1:1", expected: "Mark 1:1", message: "Use SBL book abbreviation in running text when cited with chapter/verse" }
  ])("should flag non-SBL book abbreviation in '$text'", ({ text, found, expected, message }) => {
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
    const violations = bibleBookAbbreviationsRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toBe(message);
    expect(violations[0].correction?.found).toBe(found);
    expect(violations[0].correction?.expected).toBe(expected);
  });

  it("should flag full book names in parenthetical citations", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("We see this in the text (Genesis 1:1).")
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
    const violations = bibleBookAbbreviationsRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toBe("Use SBL book abbreviation inside parentheses");
    expect(violations[0].correction?.found).toBe("Genesis 1:1");
    expect(violations[0].correction?.expected).toBe("Gen 1:1");
  });

  it("should flag abbreviations in running text when cited without chapter/verse", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("According to Gen, it states this.")
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
    const violations = bibleBookAbbreviationsRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toBe("Use spelled out book name in running text when cited without chapter/verse");
    expect(violations[0].correction?.found).toBe("Gen");
    expect(violations[0].correction?.expected).toBe("Genesis");
  });

  it.each([
    { text: "Gen 1:1 is a key verse.", found: "Gen 1:1", expected: "Genesis 1:1" },
    { text: "1 Cor 5:6 is another.", found: "1 Cor 5:6", expected: "First Corinthians 5:6" }
  ])("should flag abbreviated book name at sentence start in '$text'", ({ text, found, expected }) => {
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
    const violations = bibleBookAbbreviationsRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toBe("Use spelled out book name at the start of a sentence");
    expect(violations[0].correction?.found).toBe(found);
    expect(violations[0].correction?.expected).toBe(expected);
  });

  it("should pass correct SBL book abbreviations/names and un-abbreviated books", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("Genesis 1:1 is a key verse. In the middle of a sentence, we write Gen 1:1. We can also write Genesis as a book name on its own.")
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
    const violations = bibleBookAbbreviationsRule.check(context);

    expect(violations.length).toBe(0);
  });

  it("should not flag anything inside footnotes (footnotes excluded)", () => {
    const doc = createTestDocument({
      footnotes: [
        {
          id: 1,
          paragraphs: [createTestParagraph("Gen 1:1 and (Genesis 1:1) in footnote.")]
        }
      ]
    });
    const sections: DocumentSections = {
      titlePage: [],
      body: [],
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = bibleBookAbbreviationsRule.check(context);
    expect(violations.length).toBe(0);
  });

  it("should not flag common English words or pronouns that conflict with wrong abbreviations", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("Second, he argues that the new covenant has been established. He is correct. We read the book of Acts. She visited her ex-spouse and they decided to co-operate.")
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
    const violations = bibleBookAbbreviationsRule.check(context);

    expect(violations.length).toBe(0);
  });

  it.each([
    { text: "Make a mark on the page.", expectedViolations: 0, found: undefined, expected: undefined },
    { text: "We read mark 1:1.", expectedViolations: 1, found: "mark 1:1", expected: "Mark 1:1" },
    { text: "We see mark 1 in the text.", expectedViolations: 1, found: "mark 1", expected: "Mark 1" }
  ])("should correctly handle lowercase mark in '$text'", ({ text, expectedViolations, found, expected }) => {
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
    const violations = bibleBookAbbreviationsRule.check(context);

    expect(violations.length).toBe(expectedViolations);
    if (expectedViolations > 0) {
      expect(violations[0].correction?.found).toBe(found);
      expect(violations[0].correction?.expected).toBe(expected);
    }
  });
});
