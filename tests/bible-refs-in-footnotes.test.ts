import { describe, it, expect } from "vitest";
import { createTestParagraph, createTestDocument, createTestContext } from "./test-utils.js";
import { DocumentSections } from "../src/analysis/sections.js";
import { bibleRefsInFootnotesRule } from "../src/rules/definitions/bible-refs-in-footnotes.js";

describe("Rule 1: Bible References in Footnotes", () => {
  it("should flag Bible references inside footnotes", () => {
    const doc = createTestDocument({
      footnotes: [
        {
          id: 1,
          paragraphs: [createTestParagraph("For details, see Gen 1:1 and Matt 5:3–7.")]
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
    const violations = bibleRefsInFootnotesRule.check(context);

    expect(violations.length).toBe(2);
    expect(violations[0].ruleId).toBe("sbl-bible-refs-in-footnotes");
    expect(violations[0].severity).toBe("error");
    expect(violations[0].message).toContain('Gen 1:1');
    expect(violations[1].message).toContain('Matt 5:3–7');
  });

  it("should not flag normal academic footnotes without Bible references", () => {
    const doc = createTestDocument({
      footnotes: [
        {
          id: 1,
          paragraphs: [createTestParagraph("Compare with Augustine, Confessions 1.1.")]
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
    const violations = bibleRefsInFootnotesRule.check(context);

    expect(violations.length).toBe(0);
  });

  it.each([
    { name: "italic reference", italic: true, text: "", expectedViolations: 0, expectedMessage: undefined },
    { name: "straight double quotes", italic: false, text: 'Read the article "Matt 5:3" in the journal.', expectedViolations: 0, expectedMessage: undefined },
    { name: "curly double quotes", italic: false, text: 'Read the article “Luke 2:1” in the journal.', expectedViolations: 0, expectedMessage: undefined },
    { name: "straight single quotes", italic: false, text: "Read the article 'John 3:16' in the journal.", expectedViolations: 0, expectedMessage: undefined },
    { name: "curly single quotes", italic: false, text: "Read the article ‘Mark 1:1’ in the journal.", expectedViolations: 0, expectedMessage: undefined },
    { name: "mixed case", italic: false, text: 'See "Rom 8:28" and also check Phil 4:13.', expectedViolations: 1, expectedMessage: 'Phil 4:13' }
  ])("should ignore Bible reference in footnote when formatted as $name", ({ text, italic, expectedViolations, expectedMessage }) => {
    const doc = createTestDocument({
      footnotes: [
        {
          id: 1,
          paragraphs: [
            italic
              ? {
                  runs: [
                    { text: "Check out the book ", properties: {} },
                    { text: "Gen 1:1", properties: { italic: true } },
                    { text: " which is a great read.", properties: {} }
                  ],
                  properties: {},
                  hasPageBreakBefore: false,
                  hasImage: false,
                  footnoteRefs: []
                }
              : createTestParagraph(text)
          ]
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
    const violations = bibleRefsInFootnotesRule.check(context);

    expect(violations.length).toBe(expectedViolations);
    if (expectedViolations > 0 && expectedMessage) {
      expect(violations[0].message).toContain(expectedMessage);
    }
  });

  it("should ignore Bible references in footnotes if they are part of SBL citations", () => {
    const doc = createTestDocument({
      footnotes: [
        {
          id: 1,
          paragraphs: [
            createTestParagraph("Charles H. Talbert, Reading John (New York: Crossroad, 1992), 127."),
            createTestParagraph("Leyerle, \"John Chrysostom on the Gaze,\" JECS 1 (1993): 159–74."),
            createTestParagraph("Talbert, Reading John, 145.")
          ]
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
    const violations = bibleRefsInFootnotesRule.check(context);

    expect(violations.length).toBe(0);
  });
});
