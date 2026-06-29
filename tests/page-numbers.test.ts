import { describe, it, expect } from "vitest";
import { createTestParagraph, createTestDocument, createTestContext } from "./test-utils";
import { DocumentSections } from "../src/analysis/sections";
import { pageNumbersRule } from "../src/rules/definitions/page-numbers";

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
