import { describe, it, expect } from "vitest";
import { createTestParagraph, createTestDocument, createTestContext } from "./test-utils";
import { sblReferenceAbbreviationsRule } from "../src/rules/definitions/sbl-reference-abbreviations";

describe("Rule 12: SBL Reference Abbreviations", () => {
  it("should flag unabbreviated forms outside parentheses mid-sentence", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("In verse 3 we read this.")]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = sblReferenceAbbreviationsRule.check(context);
    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain("Unabbreviated reference form used mid-sentence");
    expect(violations[0].correction?.found).toBe("verse 3");
    expect(violations[0].correction?.expected).toBe("v. 3");
  });

  it("should pass capitalised full word at sentence start and abbreviated form mid-sentence outside parentheses", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("Verse 3 says this. Yes, v. 3 is key.")]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = sblReferenceAbbreviationsRule.check(context);
    expect(violations.length).toBe(0);
  });

  it("should flag lowercase full word at sentence start", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("verse 3 says this.")]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = sblReferenceAbbreviationsRule.check(context);
    expect(violations.length).toBe(1);
    expect(violations[0].correction?.found).toBe("verse 3");
    expect(violations[0].correction?.expected).toBe("Verse 3");
  });

  it("should flag unabbreviated forms inside parentheses", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("We read this (verse 3).")]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = sblReferenceAbbreviationsRule.check(context);
    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain("Unabbreviated reference form used mid-sentence");
    expect(violations[0].correction?.found).toBe("verse 3");
    expect(violations[0].correction?.expected).toBe("v. 3");
  });

  it("should pass abbreviated forms inside parentheses", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("We read this (v. 3).")]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = sblReferenceAbbreviationsRule.check(context);
    expect(violations.length).toBe(0);
  });

  it("should flag singular abbreviation used with a range", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("We read this (v. 10–12).")]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = sblReferenceAbbreviationsRule.check(context);
    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain("Singular reference form used with a range or list of values");
    expect(violations[0].correction?.found).toBe("v. 10–12");
    expect(violations[0].correction?.expected).toBe("vv. 10–12");
  });

  it("should flag plural abbreviation used with a single value", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("We read this (vv. 10).")]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = sblReferenceAbbreviationsRule.check(context);
    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain("Plural reference form used with a single value");
    expect(violations[0].correction?.found).toBe("vv. 10");
    expect(violations[0].correction?.expected).toBe("v. 10");
  });

  it("should enforce abbreviated forms in footnotes", () => {
    const doc = createTestDocument({
      footnotes: [
        {
          id: 1,
          paragraphs: [createTestParagraph("See verse 3.")]
        }
      ]
    });
    const sections = { titlePage: [], body: [], bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = sblReferenceAbbreviationsRule.check(context);
    expect(violations.length).toBe(1);
    expect(violations[0].correction?.found).toBe("verse 3");
    expect(violations[0].correction?.expected).toBe("v. 3");
  });

  it("should only flag unabbreviated words when followed by a number", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("In this verse, we see a key theme.")]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = sblReferenceAbbreviationsRule.check(context);
    expect(violations.length).toBe(0);
  });

  it("should flag unabbreviated article and folio forms mid-sentence and suggest correct abbreviations", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("In article 5 we see a key theme."),
        createTestParagraph("In folio 12 we read that.")
      ]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = sblReferenceAbbreviationsRule.check(context);
    expect(violations.length).toBe(2);
    expect(violations[0].correction?.found).toBe("article 5");
    expect(violations[0].correction?.expected).toBe("art. 5");
    expect(violations[1].correction?.found).toBe("folio 12");
    expect(violations[1].correction?.expected).toBe("fol. 12");
  });

  it("should flag plural / singular mismatches for article and folio abbreviations", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("We read this (art. 10–12)."),
        createTestParagraph("We read this (fols. 10).")
      ]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = sblReferenceAbbreviationsRule.check(context);
    expect(violations.length).toBe(2);
    expect(violations[0].correction?.found).toBe("art. 10–12");
    expect(violations[0].correction?.expected).toBe("arts. 10–12");
    expect(violations[1].correction?.found).toBe("fols. 10");
    expect(violations[1].correction?.expected).toBe("fol. 10");
  });
});
