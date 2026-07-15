import { describe, it, expect } from "vitest";
import { createTestParagraph, createTestDocument, createTestContext } from "./test-utils";
import { greekHebrewQuotesRule } from "../src/rules/definitions/greek-hebrew-quotes";

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

  it("should not flag dictionary entry references like s.v. or s.vv. followed by Greek/Hebrew text", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("BDAG, s.v. “ἁγιάζω”; Douglas J. Moo, Heb…"),
        createTestParagraph("See also TDNT, s.vv. “ἁγιάζω” and “λόγος”."),
        createTestParagraph("Compare sub verbo “ἁγιάζω” in the dictionary."),
        createTestParagraph("Also with comma BDAG, s.v., “ἁγιάζω”.")
      ]
    });
    const sections = { titlePage: [], body: doc.paragraphs, bibliography: [], hasTitlePage: false, hasBibliography: false };
    const context = createTestContext(doc, sections);
    const violations = greekHebrewQuotesRule.check(context);

    expect(violations.length).toBe(0);
  });
});
