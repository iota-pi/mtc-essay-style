import { describe, it, expect } from "vitest";
import { detectSblReferences, isWithinReference, isSblReferenceFootnote } from "../src/rules/sbl-reference-detector.js";

describe("SBL v2 Reference Detector", () => {
  describe("Positive Cases (Bibliographic References)", () => {
    it("should detect book first references", () => {
      const text = "Charles H. Talbert, Reading John: A Literary and Theological Commentary on the Fourth Gospel (New York: Crossroad, 1992), 127.";
      const spans = detectSblReferences(text);
      expect(spans.length).toBe(1);
      expect(spans[0].type).toBe("book-first");
      expect(text.substring(spans[0].start, spans[0].end)).toBe(text);
    });

    it("should detect book short references", () => {
      const text = "Talbert, Reading John, 145.";
      const spans = detectSblReferences(text);
      expect(spans.length).toBe(1);
      expect(spans[0].type).toBe("short-reference");
      expect(text.substring(spans[0].start, spans[0].end)).toBe(text);
    });

    it("should detect journal first references", () => {
      const text = 'Blake Leyerle, "John Chrysostom on the Gaze," JECS 1 (1993): 159–74.';
      const spans = detectSblReferences(text);
      expect(spans.length).toBe(1);
      expect(spans[0].type).toBe("journal-first");
      expect(text.substring(spans[0].start, spans[0].end)).toBe(text);
    });

    it("should detect journal short references", () => {
      const text = 'Leyerle, "John Chrysostom on the Gaze," 162.';
      const spans = detectSblReferences(text);
      expect(spans.length).toBe(1);
      expect(spans[0].type).toBe("short-reference");
      expect(text.substring(spans[0].start, spans[0].end)).toBe(text);
    });

    it("should detect chapter first references", () => {
      const text = 'Harold W. Attridge, "Jewish Historiography," in Early Judaism and Its Modern Interpreters, ed. Robert A. Kraft (Philadelphia: Fortress, 1986), 311–43.';
      const spans = detectSblReferences(text);
      expect(spans.length).toBe(1);
      expect(spans[0].type).toBe("chapter-first");
      expect(text.substring(spans[0].start, spans[0].end)).toBe(text);
    });

    it("should detect Donald Robinson chapter reference", () => {
      const text = ' Donald Robinson, “The Church in the New Testament,” in Donald Robinson: Selected Works, ed. Peter G. Bolt and Mark Thompson, 1st ed. (1959; Australian Church Record ; Moore College, 2008), 213.';
      const spans = detectSblReferences(text);
      expect(spans.length).toBe(1);
      expect(spans[0].type).toBe("chapter-first");
      expect(text.substring(spans[0].start, spans[0].end)).toBe(text.trim());
    });

    it("should detect Ibid. references", () => {
      const texts = ["Ibid., 145.", "Ibid.", "cf. Ibid., 145."];
      for (const text of texts) {
        const spans = detectSblReferences(text);
        expect(spans.length).toBe(1);
        expect(spans[0].type).toBe("ibid-reference");
      }
    });

    it("should detect references with prefixes (cf., see, see also, e.g.,)", () => {
      const prefixes = ["cf. ", "see ", "see also ", "e.g., "];
      for (const prefix of prefixes) {
        const text = `${prefix}Talbert, Reading John, 145.`;
        const spans = detectSblReferences(text);
        expect(spans.length).toBe(1);
        expect(text.substring(spans[0].start, spans[0].end)).toBe(text);
      }
    });
  });

  describe("Complex Footnote Structures", () => {
    it("should detect multiple references separated by semicolons", () => {
      const text = 'Talbert, Reading John, 145; Leyerle, "John Chrysostom," 162.';
      const spans = detectSblReferences(text);
      expect(spans.length).toBe(2);
      expect(text.substring(spans[0].start, spans[0].end)).toBe("Talbert, Reading John, 145");
      expect(text.substring(spans[1].start, spans[1].end)).toBe('Leyerle, "John Chrysostom," 162.');
    });

    it("should detect references following commentary text", () => {
      const text = "For a full discussion, see Talbert, Reading John, 145.";
      const spans = detectSblReferences(text);
      expect(spans.length).toBe(1);
      expect(text.substring(spans[0].start, spans[0].end)).toBe("see Talbert, Reading John, 145.");
    });

    it("should detect references inside parentheses", () => {
      const text = "This theological idea is common in Johannine studies (see Talbert, Reading John, 145).";
      const spans = detectSblReferences(text);
      expect(spans.length).toBe(1);
      expect(text.substring(spans[0].start, spans[0].end)).toBe("see Talbert, Reading John, 145");
    });
  });

  describe("Negative Cases (Non-References)", () => {
    it("should not detect plain prose as a reference", () => {
      const text = "This is a regular comment in a footnote explaining the author's translation choice.";
      const spans = detectSblReferences(text);
      expect(spans.length).toBe(0);
    });

    it("should not detect pure biblical reference citations as bibliographic references", () => {
      const text = "See Gen 1:1; 1 Cor 15:3-4; Rev 21:1.";
      const spans = detectSblReferences(text);
      expect(spans.length).toBe(0);
    });
  });

  describe("Helper Functions", () => {
    it("should verify isWithinReference works correctly", () => {
      const text = "See Talbert, Reading John, 145 for details.";
      const spans = detectSblReferences(text);
      // "See Talbert, Reading John, 145" is at the start (index 0 to 30)
      expect(isWithinReference(5, spans)).toBe(true);  // inside "Talbert"
      expect(isWithinReference(35, spans)).toBe(false); // inside "for details"
    });

    it("should verify isSblReferenceFootnote works correctly", () => {
      expect(isSblReferenceFootnote("Talbert, Reading John, 145.")).toBe(true);
      expect(isSblReferenceFootnote("Just some comments.")).toBe(false);
    });
  });
});
