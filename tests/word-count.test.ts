import { describe, it, expect } from "vitest";
import { countWords, countWordsInText, countFootnoteWords } from "../src/analysis/word-count";
import { DocumentSections } from "../src/analysis/sections";
import { ParsedDocument, DocxParagraph } from "../src/docx/types";

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

    it("should count footnote words excluding SBL bibliographic references but keeping prefixes", () => {
      const doc: ParsedDocument = {
        paragraphs: [],
        footnotes: [
          {
            id: 1,
            paragraphs: [createParagraph("For a full discussion, see Talbert, Reading John, 145.")]
          },
          {
            id: 2,
            paragraphs: [createParagraph("cf. Ibid., 145.")]
          }
        ],
        styles: new Map()
      };

      const sections: DocumentSections = {
        titlePage: [],
        body: [createParagraph("Body text")],
        bibliography: [],
        hasTitlePage: false,
        hasBibliography: false
      };

      const result = countWords(doc, sections);

      // Footnote 1: "For a full discussion, see Talbert, Reading John, 145."
      // Reference: "see Talbert, Reading John, 145."
      // Prefix: "see"
      // Non-reference words: "For a full discussion, see" = 5 words
      // Footnote 2: "cf. Ibid., 145."
      // Reference: "cf. Ibid., 145."
      // Prefix: "cf."
      // Non-reference words: "cf." = 1 word
      // Total footnote words = 5 + 1 = 6 words
      expect(result.footnotes).toBe(6);
    });
  });

  describe("countFootnoteWords", () => {
    it("should ignore citation words but count prefixes and prose", () => {
      expect(countFootnoteWords("Charles H. Talbert, Reading John (New York: Crossroad, 1992), 127.")).toBe(0);
      expect(countFootnoteWords("Talbert, Reading John, 145.")).toBe(0);
      expect(countFootnoteWords("For discussion, see Talbert, Reading John, 145.")).toBe(3); // "For", "discussion,", "see" (3 words)
      expect(countFootnoteWords("cf. Ibid., 145.")).toBe(1); // "cf." (1 word)
      expect(countFootnoteWords("Some comment (see Talbert, Reading John, 145) here.")).toBe(4); // "Some", "comment", "(see", "here." (4 words)
      expect(countFootnoteWords("Regular comments in a footnote.")).toBe(5);

      // User requested test cases
      expect(countFootnoteWords("Thomas R. Schreiner, “Baptism in the Epistles,” in Believer’s Baptism: Sign of the New Covenant in Christ, NAC Studies in Bible and Theology (Broadman & Holman Publishers, 2006), 77, 93; Schreiner and Wright, “Introduction,” 7.")).toBe(0);
      expect(countFootnoteWords("See also Thomas, A Case for Mixed-Audience with Reference to the Warning Passages in the Book of Hebrews, 181–272.")).toBe(2);
      expect(countFootnoteWords("Thomas, A Case for Mixed-Audience with Reference to the Warning Passages in the Book of Hebrews, 181–272.")).toBe(0);
      expect(countFootnoteWords("For a defence of Jer 32 as a new covenant text, see Paul R. Williamson, Sealed with an Oath: Covenant in God’s Unfolding Purpose, New Studies in Biblical Theology 23 (Apollos[u.a.], 2007), 164–65.")).toBe(12);
      expect(countFootnoteWords("For a defence of Jer 32 as a new covenant text, contra Paul R. Williamson, Sealed with an Oath: Covenant in God’s Unfolding Purpose, New Studies in Biblical Theology 23 (Apollos[u.a.], 2007), 164–65.")).toBe(12);

      // Extra user requested test cases
      expect(countFootnoteWords("Gentry and Wellum, Kingdom through Covenant, 555; see also: Fred A. Malone, The Baptism of Disciples Alone: A Covenantal Argument for Credobaptism versus Paedobaptism, Rev. and expanded, 2nd ed. (Founders Press, 2007), 72–76.")).toBe(2);
      expect(countFootnoteWords("Gentry and Wellum, Kingdom through Covenant, 555; Fred A. Malone, The Baptism of Disciples Alone: A Covenantal Argument for Credobaptism versus Paedobaptism, Rev. and expanded, 2nd ed. (Founders Press, 2007), 72–76.")).toBe(0);

      // test for "i.e.," prefix
      expect(countFootnoteWords("i.e., Gentry and Wellum, Kingdom through Covenant, 555.")).toBe(1); // only "i.e.," is counted
    });
  });
});
