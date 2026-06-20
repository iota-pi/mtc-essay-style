import { describe, it, expect } from "vitest";
import { createTestParagraph, createTestDocument, createTestContext } from "./test-utils.js";
import { DocumentSections } from "../src/analysis/sections.js";

// Import rules
import { bibleRefsInFootnotesRule } from "../src/rules/definitions/bible-refs-in-footnotes.js";
import { bibleRefFormatRule } from "../src/rules/definitions/bible-ref-format.js";
import { bibleBookAbbreviationsRule } from "../src/rules/definitions/bible-book-abbreviations.js";
import { abbreviationStyleRule } from "../src/rules/definitions/abbreviation-style.js";
import { quotationPunctuationRule } from "../src/rules/definitions/quotation-punctuation.js";
import { pageNumbersRule } from "../src/rules/definitions/page-numbers.js";
import { lineSpacingRule } from "../src/rules/definitions/line-spacing.js";
import { fontSizeRule } from "../src/rules/definitions/font-size.js";
import { bibleConsecutiveRefsRule } from "../src/rules/definitions/bible-consecutive-refs.js";
import { bibleRangeEndashRule } from "../src/rules/definitions/bible-range-endash.js";
import { bodyEndashRule } from "../src/rules/definitions/body-endash.js";

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
});

describe("Rule 2: Bible Reference Format", () => {
  it("should flag missing spaces in citations", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("Scripture tells us in Gen1:1 and 1Cor13:4.")]
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

    expect(violations.length).toBe(2);
    expect(violations[0].message).toContain("Gen1");
    expect(violations[1].message).toContain("1Cor13");
  });

  it("should flag ch. or v. inside citations", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("Read Gen ch. 1 or Matt 5:3, v. 4.")
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

    expect(violations.length).toBe(2);
    expect(violations[0].message).toContain('"Gen ch. 1"');
    expect(violations[1].message).toContain('Matt 5:3, v. 4');
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

describe("Rule 3: Bible Book Name Abbreviations", () => {
  it("should flag book abbreviations with trailing periods", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("Look at Gen. 1:1 or Matt. 5:3.")]
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

    expect(violations.length).toBe(2);
    expect(violations[0].message).toContain("Gen.");
    expect(violations[1].message).toContain("Matt.");
  });

  it("should flag non-SBL book abbreviations", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("See Ex 20:1 or Mk 1:1.")]
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

    expect(violations.length).toBe(2);
    expect(violations[0].message).toContain("Ex 20:1");
    expect(violations[1].message).toContain("Mk 1:1");
  });

  it("should flag full book names in citations unless at sentence start", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("In Genesis 1:1 we read something. Genesis 1:1 states this.")
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

    // Only the first one ("In Genesis 1:1") should be flagged.
    // The second one ("Genesis 1:1 states...") is at sentence start.
    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain("Genesis 1:1");
  });

  it("should pass correct SBL book abbreviations", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("We read Gen 1:1 and Mark 1:1.")]
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
});

describe("Rule 4: Abbreviation Punctuation and Capitalisation", () => {
  it("should flag incorrect forms of common abbreviations", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("Check eg, or e.g. or ie, or ie. or cf without dot. She went to et. al. and etc without dot.")
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

    expect(violations.length).toBe(7);
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
    expect(violations[0].message).toContain("ca.");
  });

  it("should pass correct forms of abbreviations", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("We can find e.g., and i.e., in the book. Cf. the first chapter. He worked with Smith et al. and etc.")
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
});

describe("Rule 5: Quotation Mark and Citation Punctuation", () => {
  it("should flag commas and periods outside quotes", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph('She said "yes", but he said "no".')]
    });
    const sections: DocumentSections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = quotationPunctuationRule.check(context);

    expect(violations.length).toBe(2);
    expect(violations[0].message).toContain('","');
    expect(violations[1].message).toContain('"."');
  });

  it("should flag semicolons and colons inside quotes", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph('He wrote "scripture;" and "command:"')]
    });
    const sections: DocumentSections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = quotationPunctuationRule.check(context);

    expect(violations.length).toBe(2);
    expect(violations[0].message).toContain('";"');
    expect(violations[1].message).toContain('":"');
  });

  it("should flag footnote reference placed before punctuation", () => {
    const doc = createTestDocument({
      paragraphs: [
        {
          runs: [
            { text: 'A quote"', properties: {} },
            { text: "", properties: {}, footnoteId: "1" },
            { text: ".", properties: {} }
          ],
          properties: {},
          hasPageBreakBefore: false,
          hasImage: false,
          footnoteRefs: [1]
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
    const violations = quotationPunctuationRule.check(context);

    expect(violations.length).toBe(2);
    // Find the footnote violation
    const fnViolation = violations.find(v => v.message.includes("Footnote reference"));
    expect(fnViolation).toBeDefined();
    expect(fnViolation!.message).toContain('before punctuation/closing quotes "."');
  });

  it("should pass correct quote and footnote placements", () => {
    const doc = createTestDocument({
      paragraphs: [
        {
          runs: [
            { text: 'A quote."', properties: {} },
            { text: "", properties: {}, footnoteId: "1" }
          ],
          properties: {},
          hasPageBreakBefore: false,
          hasImage: false,
          footnoteRefs: [1]
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
    const violations = quotationPunctuationRule.check(context);

    expect(violations.length).toBe(0);
  });
});

describe("Rule 6: Page Numbers Enabled", () => {
  it("should flag document when hasHeaderOrFooter is false", () => {
    const doc = createTestDocument({ hasHeaderOrFooter: false });
    const sections: DocumentSections = {
      titlePage: [],
      body: [],
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = pageNumbersRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain("No page numbers detected");
  });

  it("should pass when hasHeaderOrFooter is true", () => {
    const doc = createTestDocument({ hasHeaderOrFooter: true });
    const sections: DocumentSections = {
      titlePage: [],
      body: [],
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = pageNumbersRule.check(context);

    expect(violations.length).toBe(0);
  });
});

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

describe("Rule 8: Font Size 12pt", () => {
  it("should flag runs that are not size 12pt (fontSize 24)", () => {
    const doc = createTestDocument({
      paragraphs: [
        {
          runs: [{ text: "Wrong size run.", properties: { fontSize: 20 } }], // 10pt
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
    const violations = fontSizeRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain("not 12pt");
  });

  it("should pass runs that are exactly size 12pt (fontSize 24)", () => {
    const doc = createTestDocument({
      paragraphs: [
        {
          runs: [{ text: "Correct size run.", properties: { fontSize: 24 } }],
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
    const violations = fontSizeRule.check(context);

    expect(violations.length).toBe(0);
  });
});

describe("Rule 9: Consecutive Bible References Separator", () => {
  it("should flag semicolon when same chapter", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("See Gen 1:1; 5 and Matt 5:3; 5:5.")]
    });
    const sections: DocumentSections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = bibleConsecutiveRefsRule.check(context);

    expect(violations.length).toBe(2);
    expect(violations[0].message).toContain("comma (not a semicolon)");
    expect(violations[1].message).toContain("comma (not a semicolon)");
  });

  it("should flag comma when different chapters or books", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("Read Gen 1:1, 2:3 and Gen 1:1, Exod 3:2.")]
    });
    const sections: DocumentSections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };
    const context = createTestContext(doc, sections);
    const violations = bibleConsecutiveRefsRule.check(context);

    expect(violations.length).toBe(2);
    expect(violations[0].message).toContain("semicolon (not a comma)");
    expect(violations[1].message).toContain("semicolon (not a comma)");
  });

  it("should pass when separators are correct", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("Look at Gen 1:1, 5; 2:3; Exod 3:2.")]
    });
    const sections: DocumentSections = {
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
});

describe("Rule 10: Bible Range Dash Check", () => {
  it("should flag hyphens in chapter or verse ranges", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("Read Gen 1:1-3 and Gen 1-2.")]
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

    expect(violations.length).toBe(2);
    expect(violations[0].message).toContain("Gen 1:1-3");
    expect(violations[1].message).toContain("Gen 1-2");
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
