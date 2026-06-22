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

  it("should ignore Bible references in footnotes if they are in italics or inside quotes", () => {
    const doc = createTestDocument({
      footnotes: [
        {
          id: 1,
          paragraphs: [
            // Italic reference
            {
              runs: [
                { text: "Check out the book ", properties: {} },
                { text: "Gen 1:1", properties: { italic: true } },
                { text: " which is a great read.", properties: {} }
              ],
              properties: {},
              hasPageBreakBefore: false,
              hasImage: false,
              footnoteRefs: []
            },
            // Reference inside quotes (straight double quotes)
            createTestParagraph('Read the article "Matt 5:3" in the journal.'),
            // Reference inside quotes (curly double quotes)
            createTestParagraph('Read the article “Luke 2:1” in the journal.'),
            // Reference inside quotes (straight single quotes)
            createTestParagraph("Read the article 'John 3:16' in the journal."),
            // Reference inside quotes (curly single quotes)
            createTestParagraph("Read the article ‘Mark 1:1’ in the journal."),
            // Mixed case: one inside quotes, one not
            createTestParagraph('See "Rom 8:28" and also check Phil 4:13.')
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

    // Only Phil 4:13 should be flagged, the rest should be ignored
    expect(violations.length).toBe(1);
    expect(violations[0].message).toContain('Phil 4:13');
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
    expect(violations[0].message).toBe("Missing space in Bible reference");
    expect(violations[0].correction?.found).toBe("Gen1");
    expect(violations[0].correction?.expected).toBe("Gen 1");
    expect(violations[1].message).toBe("Missing space in Bible reference");
    expect(violations[1].correction?.found).toBe("1Cor13");
    expect(violations[1].correction?.expected).toBe("1Cor 13");
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
    expect(violations[0].message).toBe("Do not use 'ch.' or 'chapter' in Bible citations");
    expect(violations[0].correction?.found).toBe("Gen ch. 1");
    expect(violations[0].correction?.expected).toBe("Gen 1");
    expect(violations[1].message).toBe("Do not use 'v.', 'verse', 'vv.', or 'verses' in Bible citations");
    expect(violations[1].correction?.found).toBe("Matt 5:3, v. 4");
    expect(violations[1].correction?.expected).toBe("Matt 5:3, 4");
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
      paragraphs: [createTestParagraph("Look at (Gen. 1:1) or Matt. 5:3.")]
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
    expect(violations[0].message).toBe("Use SBL book abbreviation inside parentheses");
    expect(violations[0].correction?.found).toBe("Gen. 1:1");
    expect(violations[0].correction?.expected).toBe("Gen 1:1");
    expect(violations[1].message).toBe("Use SBL book abbreviation in running text when cited with chapter/verse");
    expect(violations[1].correction?.found).toBe("Matt. 5:3");
    expect(violations[1].correction?.expected).toBe("Matt 5:3");
  });

  it("should flag non-SBL book abbreviations", () => {
    const doc = createTestDocument({
      paragraphs: [createTestParagraph("See (Ex 20:1) or Mk 1:1.")]
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
    expect(violations[0].message).toBe("Use SBL book abbreviation inside parentheses");
    expect(violations[0].correction?.found).toBe("Ex 20:1");
    expect(violations[0].correction?.expected).toBe("Exod 20:1");
    expect(violations[1].message).toBe("Use SBL book abbreviation in running text when cited with chapter/verse");
    expect(violations[1].correction?.found).toBe("Mk 1:1");
    expect(violations[1].correction?.expected).toBe("Mark 1:1");
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

  it("should flag abbreviated/un-spelled out book names at sentence start", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("Gen 1:1 is a key verse. 1 Cor 5:6 is another.")
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

    expect(violations.length).toBe(2);
    expect(violations[0].message).toBe("Use spelled out book name at the start of a sentence");
    expect(violations[0].correction?.found).toBe("Gen 1:1");
    expect(violations[0].correction?.expected).toBe("Genesis 1:1");
    expect(violations[1].message).toBe("Use spelled out book name at the start of a sentence");
    expect(violations[1].correction?.found).toBe("1 Cor 5:6");
    expect(violations[1].correction?.expected).toBe("First Corinthians 5:6");
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

  it("should ignore lowercase 'mark' unless followed by a reference number", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("Make a mark on the page. We read mark 1:1 and we see mark 1 in the text.")
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

    // It should flag "mark 1:1" and "mark 1", but NOT "mark on the page"
    expect(violations.length).toBe(2);
    expect(violations[0].correction?.found).toBe("mark 1:1");
    expect(violations[0].correction?.expected).toBe("Mark 1:1");
    expect(violations[1].correction?.found).toBe("mark 1");
    expect(violations[1].correction?.expected).toBe("Mark 1");
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
    expect(violations[0].correction?.found).toBe("eg,");
    expect(violations[0].correction?.expected).toBe("e.g.,");
    expect(violations[1].correction?.found).toBe("e.g.");
    expect(violations[1].correction?.expected).toBe("e.g.,");
    expect(violations[2].correction?.found).toBe("ie,");
    expect(violations[2].correction?.expected).toBe("i.e.,");
    expect(violations[3].correction?.found).toBe("ie.");
    expect(violations[3].correction?.expected).toBe("i.e.,");
    expect(violations[4].correction?.found).toBe("cf ");
    expect(violations[4].correction?.expected).toBe("cf.");
    expect(violations[5].correction?.found).toBe("et. al.");
    expect(violations[5].correction?.expected).toBe("et al.");
    expect(violations[6].correction?.found).toBe("etc");
    expect(violations[6].correction?.expected).toBe("etc.");
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
    expect(violations[0].message).toBe("Incorrect separator in consecutive Bible references: use a comma to separate references within the same chapter");
    expect(violations[0].correction?.found).toBe("; 5");
    expect(violations[0].correction?.expected).toBe(", 5");
    expect(violations[1].message).toBe("Redundant chapter number in consecutive Bible references");
    expect(violations[1].correction?.found).toBe("; 5:5");
    expect(violations[1].correction?.expected).toBe(", 5");
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

    expect(violations.length).toBe(3);
    expect(violations[0].message).toBe("Incorrect separator in consecutive Bible references: use a semicolon to separate references in different chapters/books");
    expect(violations[0].correction?.found).toBe(", 2:3");
    expect(violations[0].correction?.expected).toBe("; 2:3");
    expect(violations[1].message).toBe("Redundant book name in consecutive Bible references");
    expect(violations[1].correction?.found).toBe(" and Gen 1:1");
    expect(violations[1].correction?.expected).toBe(" and 1:1");
    expect(violations[2].message).toBe("Incorrect separator in consecutive Bible references: use a semicolon to separate references in different chapters/books");
    expect(violations[2].correction?.found).toBe(", Exod 3:2");
    expect(violations[2].correction?.expected).toBe("; Exod 3:2");
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
    expect(violations[0].message).toBe("Use an en-dash (–) instead of a hyphen (-) for ranges in Bible references");
    expect(violations[0].correction?.found).toBe("Gen 1:1-3");
    expect(violations[0].correction?.expected).toBe("Gen 1:1–3");
    expect(violations[1].message).toBe("Use an en-dash (–) instead of a hyphen (-) for ranges in Bible references");
    expect(violations[1].correction?.found).toBe("Gen 1-2");
    expect(violations[1].correction?.expected).toBe("Gen 1–2");
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
  it("should flag Greek and Hebrew words inside quote marks", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("We look at the word “λόγος”. Also look at ‘בראשית’ and \"בראשית\" and 'λόγος'.")
      ]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = greekHebrewQuotesRule.check(context);

    expect(violations.length).toBe(4);
    expect(violations[0].correction?.found).toBe("“λόγος”");
    expect(violations[0].correction?.expected).toBe("λόγος");
    expect(violations[1].correction?.found).toBe("‘בראשית’");
    expect(violations[1].correction?.expected).toBe("בראשית");
    expect(violations[2].correction?.found).toBe("\"בראשית\"");
    expect(violations[2].correction?.expected).toBe("בראשית");
    expect(violations[3].correction?.found).toBe("'λόγος'");
    expect(violations[3].correction?.expected).toBe("λόγος");
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

