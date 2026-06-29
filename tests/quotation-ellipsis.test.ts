import { describe, it, expect } from "vitest";
import { createTestParagraph, createTestDocument, createTestContext } from "./test-utils";
import { quotationEllipsisRule } from "../src/rules/definitions/quotation-ellipsis";

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
