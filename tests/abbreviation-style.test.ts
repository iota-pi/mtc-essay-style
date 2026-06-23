import { describe, it, expect } from "vitest";
import { createTestParagraph, createTestDocument, createTestContext } from "./test-utils.js";
import { DocumentSections } from "../src/analysis/sections.js";
import { abbreviationStyleRule } from "../src/rules/definitions/abbreviation-style.js";

describe("Rule 4: Abbreviation Punctuation and Capitalisation", () => {
  it.each([
    { text: "Check eg, here.", found: "eg,", expected: "e.g.," },
    { text: "Check e.g. here.", found: "e.g.", expected: "e.g.," },
    { text: "Check ie, here.", found: "ie,", expected: "i.e.," },
    { text: "Check ie. here.", found: "ie.", expected: "i.e.," },
    { text: "Check cf without dot.", found: "cf ", expected: "cf." },
    { text: "She went to et. al. and others.", found: "et. al.", expected: "et al." },
    { text: "Check etc without dot.", found: "etc", expected: "etc." }
  ])("should flag incorrect abbreviation form in '$text'", ({ text, found, expected }) => {
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
    const violations = abbreviationStyleRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].correction?.found).toBe(found);
    expect(violations[0].correction?.expected).toBe(expected);
  });

  it("should flag incorrect circa ca.", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("He lived ca 1500.")]
    });
    const sections: DocumentSections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = abbreviationStyleRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].correction?.found).toBe("ca 1500");
    expect(violations[0].correction?.expected).toBe("ca. 1500");
  });

  it("should pass correct forms of abbreviations", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("We can find e.g., and i.e., in the book. Cf. the first chapter. He worked with Smith et al. and etc.")
      ],
      footnotes: [
        {
          id: 1,
          paragraphs: [
            createTestParagraph(" E.g., Thomas R. Schreiner and Shawn D. …")
          ]
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
    const violations = abbreviationStyleRule.check(context);

    expect(violations.length).toBe(0);
  });

  it("should flag Old Testament and New Testament to suggest OT and NT", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("The Old Testament has many books. Similarly, the New Testament has many.")
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
    const violations = abbreviationStyleRule.check(context);

    expect(violations.length).toBe(2);
    expect(violations[0].correction?.found).toBe("Old Testament");
    expect(violations[0].correction?.expected).toBe("OT");
    expect(violations[1].correction?.found).toBe("New Testament");
    expect(violations[1].correction?.expected).toBe("NT");
  });

  it("should not flag abbreviation violations inside series titles or SBL footnote references", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("We reference the New International Commentary on the New Testament series.")
      ],
      footnotes: [
        {
          id: 1,
          paragraphs: [
            createTestParagraph("See Green, Luke, New International Commentary on the New Testament (1997), 150."),
            createTestParagraph("Frederick W. Danker et al., A Greek-English Lexicon of the New Testament and Other Early Christian Literature, 3rd ed. (Chicago: University of Chicago Press, 2000), 125."),
            createTestParagraph(" Donald Robinson, “The Church in the New Testament,” in Donald Robinson: Selected Works, ed. Peter G. Bolt and Mark Thompson, 1st ed. (1959; Australian Church Record ; Moore College, 2008), 213.")
          ]
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
    const violations = abbreviationStyleRule.check(context);
    expect(violations.length).toBe(0);
  });

  it("should not flag abbreviation violations inside bold runs or heading paragraphs", () => {
    const doc = createTestDocument({
      paragraphs: [
        // Heading paragraph
        createTestParagraph("New Testament is a book.", {
          properties: { outlineLevel: 1 }
        }),
        // Bold run
        {
          runs: [
            { text: "Check out this bold ", properties: {} },
            { text: "New Testament", properties: { bold: true } },
            { text: " reference.", properties: {} }
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
    const violations = abbreviationStyleRule.check(context);

    // No violations should be flagged for abbreviation style inside the bold run or heading paragraph
    expect(violations.length).toBe(0);
  });
});
