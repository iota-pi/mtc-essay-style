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
import { sblReferenceAbbreviationsRule } from "../src/rules/definitions/sbl-reference-abbreviations.js";
import { greekHebrewQuotesRule } from "../src/rules/definitions/greek-hebrew-quotes.js";
import { quotationEllipsisRule } from "../src/rules/definitions/quotation-ellipsis.js";

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


describe("Rule 2: Bible Reference Format", () => {
  it.each([
    { citation: "Gen1:1", found: "Gen1", expected: "Gen 1" },
    { citation: "1Cor13:4", found: "1Cor13", expected: "1Cor 13" }
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

describe("Rule 5: Quotation Mark and Citation Punctuation", () => {
  it.each([
    { text: 'She said "yes", but he said "no".', found: '",', expected: ',"' },
    { text: 'He said "no".', found: '".', expected: '."' }
  ])("should flag punctuation outside quotes in '$text'", ({ text, found, expected }) => {
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
    const violations = quotationPunctuationRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain(`Place punctuation inside quotes: replace '${found}' with '${expected}'`);
  });

  it.each([
    { text: 'He wrote "scripture;" and...', found: '";' },
    { text: 'He wrote "command:" and...', found: '":' }
  ])("should flag semicolons or colons inside quotes in '$text'", ({ text }) => {
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
    const violations = quotationPunctuationRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain(`Place colons and semicolons outside quotation marks`);
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

  it("should pass when paragraph has undefined line spacing but Normal style defines double spacing", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("This paragraph has no direct spacing, it inherits Normal style spacing.")
      ],
      styles: new Map([
        [
          "Normal",
          {
            styleId: "Normal",
            name: "Normal",
            type: "paragraph",
            paragraphProperties: { lineSpacing: { line: 480, lineRule: "auto" } }
          }
        ]
      ])
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

  it("should report and abridge the specific text which is not the right size", () => {
    const doc = createTestDocument({
      paragraphs: [
        {
          runs: [
            { text: "This is a very long paragraph that has a portion of text that is not the right size.", properties: { fontSize: 24 } },
            { text: "This part is incorrectly sized and is longer than twenty five characters.", properties: { fontSize: 20 } },
            { text: " This part is back to correct size.", properties: { fontSize: 24 } }
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
    const violations = fontSizeRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain('Paragraph contains text that is not 12pt: "This part is incorrectly..." (10pt). All body text must be exactly 12pt.');
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

  it("should pass runs that are undefined but Normal style defines size 12pt (fontSize 24)", () => {
    const doc = createTestDocument({
      paragraphs: [
        {
          runs: [{ text: "Default size run.", properties: {} }],
          properties: {},
          hasPageBreakBefore: false,
          hasImage: false,
          footnoteRefs: []
        }
      ],
      styles: new Map([
        [
          "Normal",
          {
            styleId: "Normal",
            name: "Normal",
            type: "paragraph",
            runProperties: { fontSize: 24 }
          }
        ]
      ])
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
  it.each([
    { text: "See Gen 1:1; 5", found: "; 5", expected: ", 5", message: "Incorrect separator in consecutive Bible references: use a comma to separate references within the same chapter" },
    { text: "See Matt 5:3; 5:5", found: "; 5:5", expected: ", 5", message: "Redundant chapter number in consecutive Bible references" }
  ])("should flag semicolon when same chapter in '$text'", ({ text, found, expected, message }) => {
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
    const sections: DocumentSections = {
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
});

describe("Rule 13: Greek and Hebrew Quotes Check", () => {
  it.each([
    { text: "We look at the word “λόγος”.", found: "“λόγος”", expected: "λόγος" },
    { text: "Also look at ‘בראשית’.", found: "‘בראשית’", expected: "בראשית" },
    { text: "Also look at \"בראשית\".", found: "\"בראשית\"", expected: "בראשית" },
    { text: "Also look at 'λόγος'.", found: "'λόγος'", expected: "λόγος" }
  ])("should flag quoted foreign word in '$text'", ({ text, found, expected }) => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph(text)]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = greekHebrewQuotesRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].correction?.found).toBe(found);
    expect(violations[0].correction?.expected).toBe(expected);
  });

  it("should not flag English quotes containing Greek or Hebrew words", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("He said, “The word is λόγος.” In the beginning of ‘Hebrew: בראשית’ we see this.")
      ]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = greekHebrewQuotesRule.check(context);

    expect(violations.length).toBe(0);
  });

  it("should flag Greek and Hebrew words in nested quotations", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("He said, “The Greek word is ‘λόγος’ in this passage.”")
      ]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = greekHebrewQuotesRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].correction?.found).toBe("‘λόγος’");
    expect(violations[0].correction?.expected).toBe("λόγος");
  });
});

describe("Rule 14: Quotation Ellipsis Spacing", () => {
  it.each([
    { text: "He said, “This is…incorrect.”" },
    { text: "He said, “This is ...incorrect.”" },
    { text: "He said, “This is… incorrect.”" },
    { text: "He said, “This is …incorrect.”" }
  ])("should flag improperly spaced ellipsis in '$text'", ({ text }) => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph(text)]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = quotationEllipsisRule.check(context);

    expect(violations.length).toBe(1);
    expect(violations[0].ruleId).toBe("sbl-quotation-ellipsis");
    expect(violations[0].severity).toBe("error");
  });

  it("should pass ellipsis inside quotation marks with spaces around it", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("He said, “He arrived from England in his early childhood … never to return.”"),
        createTestParagraph("He said, “He arrived from England in his early childhood ... never to return.”")
      ]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = quotationEllipsisRule.check(context);

    expect(violations.length).toBe(0);
  });

  it("should ignore ellipsis outside quotation marks", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("This is an ellipsis…outside quotes."),
        createTestParagraph("This is an ellipsis...outside quotes.")
      ]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = quotationEllipsisRule.check(context);

    expect(violations.length).toBe(0);
  });
});

