import { describe, it, expect } from "vitest";
import { countWords, countWordsInText } from "../src/analysis/word-count.js";
import { DocumentSections } from "../src/analysis/sections.js";
import { ParsedDocument, DocxParagraph } from "../src/docx/types.js";

function createParagraph(text: string): DocxParagraph {
  return {
    runs: [{ text, properties: {} }],
    properties: {},
    hasPageBreakBefore: false,
    hasImage: false,
    footnoteRefs: []
  };
}

describe("Word Counting Utility", () => {
  describe("countWordsInText", () => {
    it("should count simple words", () => {
      expect(countWordsInText("hello world")).toBe(2);
      expect(countWordsInText("   one   two   three   ")).toBe(3);
    });

    it("should handle punctuation", () => {
      expect(countWordsInText("hello, world! inside, outside.")).toBe(4);
    });

    it("should count hyphenated words and contractions as one word", () => {
      expect(countWordsInText("self-evident co-operation")).toBe(2);
      expect(countWordsInText("don't won't shouldn't")).toBe(3);
    });

    it("should ignore punctuation-only tokens", () => {
      expect(countWordsInText("hello --- world ...")).toBe(2);
    });

    it("should handle empty or whitespace-only inputs", () => {
      expect(countWordsInText("")).toBe(0);
      expect(countWordsInText("    ")).toBe(0);
    });
  });

  describe("countWords", () => {
    it("should count document sections correctly", () => {
      const doc: ParsedDocument = {
        paragraphs: [],
        footnotes: [
          {
            id: 1,
            paragraphs: [createParagraph("This is footnote one.")]
          }
        ],
        styles: new Map()
      };

      const sections: DocumentSections = {
        titlePage: [createParagraph("Title page cover sheet text")],
        body: [
          createParagraph("First paragraph of the main body text."),
          createParagraph("Second paragraph of the main body text.")
        ],
        bibliography: [
          createParagraph("References"),
          createParagraph("Smith, J. (2020). Book.")
        ],
        hasTitlePage: true,
        hasBibliography: true
      };

      const result = countWords(doc, sections);

      // Title page: "Title page cover sheet text" = 5 words
      expect(result.titlePage).toBe(5);

      // Body:
      // "First paragraph of the main body text." = 7 words
      // "Second paragraph of the main body text." = 7 words
      // Total bodyText = 14 words
      expect(result.bodyText).toBe(14);

      // Footnotes: "This is footnote one." = 4 words
      expect(result.footnotes).toBe(4);

      // Bibliography:
      // "References" = 1 word
      // "Smith, J. (2020). Book." = 4 words (J. and 2020 count as words, but not parenthetical punctuation)
      // Wait, let's trace "Smith, J. (2020). Book.":
      // tokens: ["Smith,", "J.", "(2020).", "Book."]
      // "Smith," (has letters) -> 1
      // "J." (has letters) -> 2
      // "(2020)." (has digits) -> 3
      // "Book." (has letters) -> 4
      // Total 4 words. Let's make sure it's 5 words total in bibliography.
      expect(result.bibliography).toBe(5);

      // Total = bodyText + footnotes = 14 + 4 = 18 words
      expect(result.total).toBe(18);
    });
  });
});
