import { describe, it, expect } from "vitest";
import { classifySections } from "../src/analysis/sections";
import { ParsedDocument, DocxParagraph } from "../src/docx/types";

function createParagraph(text: string, options: Partial<DocxParagraph> = {}): DocxParagraph {
  const properties = options.properties || {};
  if (options.hasPageBreakBefore && properties.pageBreakBefore === undefined) {
    properties.pageBreakBefore = true;
  }
  return {
    runs: [{ text, properties: {} }],
    properties,
    hasPageBreakBefore: false,
    hasImage: false,
    footnoteRefs: [],
    ...options
  };
}

describe("Document Sections Classifier", () => {
  it("should classify sections without title page or bibliography", () => {
    const doc: ParsedDocument = {
      paragraphs: [
        createParagraph("Paragraph 1"),
        createParagraph("Paragraph 2")
      ],
      footnotes: [],
      styles: new Map()
    };

    const sections = classifySections(doc);
    expect(sections.hasTitlePage).toBe(false);
    expect(sections.hasBibliography).toBe(false);
    expect(sections.body.length).toBe(2);
    expect(sections.titlePage.length).toBe(0);
    expect(sections.bibliography.length).toBe(0);
  });

  it("should detect title page if 'cover sheet' is present on page 1", () => {
    const doc: ParsedDocument = {
      paragraphs: [
        createParagraph("My Cover Sheet Page"),
        createParagraph("Title text"),
        createParagraph("Section 1", { hasPageBreakBefore: true }),
        createParagraph("Body paragraph 1")
      ],
      footnotes: [],
      styles: new Map()
    };

    const sections = classifySections(doc);
    expect(sections.hasTitlePage).toBe(true);
    expect(sections.titlePage.length).toBe(2); // first two paragraphs are page 1
    expect(sections.body.length).toBe(2);
    expect(sections.titlePage[0].runs[0].text).toBe("My Cover Sheet Page");
    expect(sections.body[0].runs[0].text).toBe("Section 1");
  });

  it("should detect title page if an image is on page 1", () => {
    const doc: ParsedDocument = {
      paragraphs: [
        createParagraph("", { hasImage: true }),
        createParagraph("Intro text", { hasPageBreakBefore: true }),
        createParagraph("Body text")
      ],
      footnotes: [],
      styles: new Map()
    };

    const sections = classifySections(doc);
    expect(sections.hasTitlePage).toBe(true);
    expect(sections.titlePage.length).toBe(1);
    expect(sections.body.length).toBe(2);
  });

  it("should detect bibliography at the end of the document", () => {
    const doc: ParsedDocument = {
      paragraphs: [
        createParagraph("Intro"),
        createParagraph("Body"),
        createParagraph("Bibliography:"), // matches "bibliography" after trimming/cleaning
        createParagraph("Smith, 2020."),
        createParagraph("Jones, 2021.")
      ],
      footnotes: [],
      styles: new Map()
    };

    const sections = classifySections(doc);
    expect(sections.hasBibliography).toBe(true);
    expect(sections.body.length).toBe(2);
    expect(sections.bibliography.length).toBe(3);
    expect(sections.bibliography[0].runs[0].text).toBe("Bibliography:");
  });

  it("should handle heading variants (case-insensitive)", () => {
    const doc: ParsedDocument = {
      paragraphs: [
        createParagraph("Intro"),
        createParagraph("Works Cited"),
        createParagraph("Smith, 2020.")
      ],
      footnotes: [],
      styles: new Map()
    };

    const sections = classifySections(doc);
    expect(sections.hasBibliography).toBe(true);
    expect(sections.bibliography.length).toBe(2);
  });

  it("should not detect title page for single page document even with cover sheet text", () => {
    const doc: ParsedDocument = {
      paragraphs: [
        createParagraph("This is page 1 with cover sheet text."),
        createParagraph("And it has a body paragraph.")
      ],
      footnotes: [],
      styles: new Map()
    };

    const sections = classifySections(doc);
    expect(sections.hasTitlePage).toBe(false);
    expect(sections.body.length).toBe(2);
  });

  it("should not detect title page if page 1 has body-length paragraph", () => {
    const longParagraphText = "This is a very long paragraph that simulates body text on the first page. It contains a lot of words to ensure it exceeds the paragraph length threshold. By having this many words, it should trigger the logic that flags page 1 as part of the body instead of a title page, even if an image or cover sheet keyword is present.";
    const doc: ParsedDocument = {
      paragraphs: [
        createParagraph(longParagraphText, { hasImage: true }),
        createParagraph("Next Page Text", { hasPageBreakBefore: true })
      ],
      footnotes: [],
      styles: new Map()
    };

    const sections = classifySections(doc);
    expect(sections.hasTitlePage).toBe(false);
    expect(sections.body.length).toBe(2);
  });

  it("should detect page break via section break hasPageBreakAfter", () => {
    const doc: ParsedDocument = {
      paragraphs: [
        createParagraph("My Cover Sheet Page", { hasPageBreakAfter: true }),
        createParagraph("This is Section 1 on page 2")
      ],
      footnotes: [],
      styles: new Map()
    };

    const sections = classifySections(doc);
    // Since hasPageBreakAfter is true, the document has 2 pages.
    // The first paragraph is on page 1, the second on page 2.
    // Page 1 has "cover sheet" text (word "Cover" is in "Cover Sheet Page"), so it detects title page!
    expect(sections.hasTitlePage).toBe(true);
    expect(sections.titlePage.length).toBe(1);
    expect(sections.body.length).toBe(1);
    expect(sections.body[0].runs[0].text).toBe("This is Section 1 on page 2");
  });
});
