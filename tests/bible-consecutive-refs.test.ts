import { describe, it, expect } from "vitest";
import { createTestParagraph, createTestDocument, createTestContext } from "./test-utils";
import { bibleConsecutiveRefsRule } from "../src/rules/definitions/bible-consecutive-refs";

describe("Rule 9: Consecutive Bible References Separator", () => {
  it.each([
    { text: "See Gen 1:1; 5", found: "; 5", expected: ", 5", message: "Incorrect separator in consecutive Bible references: use a comma to separate references within the same chapter" },
    { text: "See Matt 5:3; 5:5", found: "; 5:5", expected: ", 5", message: "Redundant chapter number in consecutive Bible references" }
  ])("should flag semicolon when same chapter in '$text'", ({ text, found, expected, message }) => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph(text)]
    });
    const sections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = bibleConsecutiveRefsRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toBe(message);
    expect(violations[0].correction?.found).toBe(found);
    expect(violations[0].correction?.expected).toBe(expected);
  });

  it.each([
    { text: "Read Gen 1:1, 2:3.", found: ", 2:3", expected: "; 2:3", message: "Incorrect separator in consecutive Bible references: use a semicolon to separate references in different chapters/books" },
    { text: "Read Gen 1:1, Exod 3:2.", found: ", Exod 3:2", expected: "; Exod 3:2", message: "Incorrect separator in consecutive Bible references: use a semicolon to separate references in different chapters/books" }
  ])("should flag comma when different chapters/books in '$text'", ({ text, found, expected, message }) => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph(text)]
    });
    const sections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = bibleConsecutiveRefsRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toBe(message);
    expect(violations[0].correction?.found).toBe(found);
    expect(violations[0].correction?.expected).toBe(expected);
  });

  it("should pass when separators are correct", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("Look at Gen 1:1, 5; 2:3; Exod 3:2.")]
    });
    const sections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = bibleConsecutiveRefsRule.check(context);

    expect(violations.length).toBe(0);
  });

  it("should flag redundant book names", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("Check 1 Kgs 11:11; 1 Kgs 16:29–33.")]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = bibleConsecutiveRefsRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toBe("Redundant book name in consecutive Bible references");
    expect(violations[0].correction?.found).toBe("; 1 Kgs 16:29–33");
    expect(violations[0].correction?.expected).toBe("; 16:29–33");
  });

  it("should flag redundant chapter numbers", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("Check 1 Kgs 11:11, 11:15.")]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = bibleConsecutiveRefsRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toBe("Redundant chapter number in consecutive Bible references");
    expect(violations[0].correction?.found).toBe(", 11:15");
    expect(violations[0].correction?.expected).toBe(", 15");
  });

  it("should flag both redundant book name and chapter number", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("Check 1 Kgs 11:11; 1 Kgs 11:15.")]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = bibleConsecutiveRefsRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toBe("Redundant book name in consecutive Bible references");
    expect(violations[0].correction?.found).toBe("; 1 Kgs 11:15");
    expect(violations[0].correction?.expected).toBe(", 15");
  });
});
