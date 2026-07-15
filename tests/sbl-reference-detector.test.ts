import { describe, it, expect } from "vitest";
import {
  detectSblReferences,
  isWithinReference,
  isSblReferenceFootnote,
  detectAndExtractReferences,
  extractReferenceFields
} from "../src/rules/sbl-reference-detector";

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

    it("should detect book short references without page numbers", () => {
      const text = "Schreiner and Caneday, The Race Set before Us.";
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

    it("should detect references with prefixes (cf., see, see also, e.g., contra, following, so, similarly, etc.)", () => {
      const prefixes = [
        "cf. ",
        "see ",
        "see also ",
        "see esp. ",
        "see especially ",
        "see e.g., ",
        "see, esp. ",
        "see, e.g., ",
        "e.g., ",
        "i.e., ",
        "contra ",
        "following ",
        "so ",
        "similarly ",
        "esp. ",
        "especially ",
        "also ",
        "according to ",
        "as argued in ",
        "as argued by ",
        "as discussed in ",
        "as noted in ",
        "as noted by ",
        "quoted in ",
        "cited in "
      ];
      for (const prefix of prefixes) {
        const text = `${prefix}Talbert, Reading John, 145.`;
        const spans = detectSblReferences(text);
        expect(spans.length).toBe(1);
        expect(text.substring(spans[0].start, spans[0].end)).toBe(text);
      }
    });

    it("should detect references using other referencing terms like art. and fol.", () => {
      const texts = [
        "Talbert, Reading John, art. 5.",
        "Talbert, Reading John, arts. 5–7.",
        "Talbert, Reading John, fol. 12.",
        "Talbert, Reading John, fols. 12–15.",
        "Ibid., art. 5.",
        "Ibid., fol. 12."
      ];
      for (const text of texts) {
        const spans = detectSblReferences(text);
        expect(spans.length).toBe(1);
        expect(text.substring(spans[0].start, spans[0].end)).toBe(text);
      }
    });

    it("should detect journal first references with nested quotes and apostrophes in the title", () => {
      const text = "Neil G. T. Jeffers, “‘And Their Children After Them’: A Response to Reformed Baptist Readings of Jeremiah’s New Covenant Promises,” Ecclesia Reformanda 1.2 (2009): 149.";
      const spans = detectSblReferences(text);
      expect(spans.length).toBe(1);
      expect(spans[0].type).toBe("journal-first");
      expect(text.substring(spans[0].start, spans[0].end)).toBe(text);
    });

    it("should detect first references without page numbers (citing entire work)", () => {
      const journalText = "Charles R. Schulz, “Communing with the Betrayer: The Presence and Significance of Judas at the Last Supper among Patristic Sources,” Concordia Theological Quarterly 86.2 (2022).";
      const journalSpans = detectSblReferences(journalText);
      expect(journalSpans.length).toBe(1);
      expect(journalSpans[0].type).toBe("journal-first");

      const bookText = "Charles H. Talbert, Reading John: A Literary and Theological Commentary (New York: Crossroad, 1992).";
      const bookSpans = detectSblReferences(bookText);
      expect(bookSpans.length).toBe(1);
      expect(bookSpans[0].type).toBe("book-first");

      const chapterText = 'Harold W. Attridge, "Jewish Historiography," in Early Judaism and Its Modern Interpreters, ed. Robert A. Kraft (Philadelphia: Fortress, 1986).';
      const chapterSpans = detectSblReferences(chapterText);
      expect(chapterSpans.length).toBe(1);
      expect(chapterSpans[0].type).toBe("chapter-first");
    });

    it("should detect footnote with introductory text and journal citation without page numbers", () => {
      const text = "For a history of interpretation on Judas’ presence, see Charles R. Schulz, “Communing with the Betrayer: The Presence and Significance of Judas at the Last Supper among Patristic Sources,” Concordia Theological Quarterly 86.2 (2022).";
      const spans = detectSblReferences(text);
      expect(spans.length).toBe(1);
      expect(spans[0].type).toBe("journal-first");
      expect(text.substring(spans[0].start, spans[0].end)).toBe("see Charles R. Schulz, “Communing with the Betrayer: The Presence and Significance of Judas at the Last Supper among Patristic Sources,” Concordia Theological Quarterly 86.2 (2022).");
    });

    it("should detect references with author initials (e.g. D. A. Carson, J. I. Packer)", () => {
      const chapterText = "D. A. Carson, “Reflections on Assurance,” in Still Sovereign: Contemporary Perspectives on Election, Foreknowledge & Grace, 2nd ed. (Baker Books, 2000), 260.";
      const chapterSpans = detectSblReferences(chapterText);
      expect(chapterSpans.length).toBe(1);
      expect(chapterSpans[0].type).toBe("book-first");

      const journalText = "J. I. Packer, “Baptism: A Sacrament of the Covenant of Grace,” Churchman 69.2 (1955).";
      const journalSpans = detectSblReferences(journalText);
      expect(journalSpans.length).toBe(1);
      expect(journalSpans[0].type).toBe("journal-first");
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

  describe("Field Extraction", () => {
    it("should extract fields from book first reference", () => {
      const text = "Charles H. Talbert, Reading John: A Literary and Theological Commentary (New York: Crossroad, 1992), 127.";
      const refs = detectAndExtractReferences(text);
      expect(refs.length).toBe(1);
      expect(refs[0].author).toBe("Talbert");
      expect(refs[0].title).toBe("Reading John: A Literary and Theological Commentary");
      expect(refs[0].year).toBe("1992");
    });

    it("should extract fields from journal first reference", () => {
      const text = 'Blake Leyerle, "John Chrysostom on the Gaze," JECS 1 (1993): 159–74.';
      const refs = detectAndExtractReferences(text);
      expect(refs.length).toBe(1);
      expect(refs[0].author).toBe("Leyerle");
      expect(refs[0].title).toBe("John Chrysostom on the Gaze");
      expect(refs[0].containerTitle).toBe("JECS");
      expect(refs[0].year).toBe("1993");
    });

    it("should extract fields from chapter first reference", () => {
      const text = 'Harold W. Attridge, "Jewish Historiography," in Early Judaism and Its Modern Interpreters, ed. Robert A. Kraft (Philadelphia: Fortress, 1986), 311–43.';
      const refs = detectAndExtractReferences(text);
      expect(refs.length).toBe(1);
      expect(refs[0].author).toBe("Attridge");
      expect(refs[0].title).toBe("Jewish Historiography");
      expect(refs[0].containerTitle).toBe("Early Judaism and Its Modern Interpreters");
      expect(refs[0].year).toBe("1986");
    });

    it("should extract fields from short reference", () => {
      const text = "Talbert, Reading John, 145.";
      const refs = detectAndExtractReferences(text);
      expect(refs.length).toBe(1);
      expect(refs[0].author).toBe("Talbert");
      expect(refs[0].title).toBe("Reading John");
    });

    it("should extract fields from short reference without page numbers", () => {
      const text = "Schreiner and Caneday, The Race Set before Us.";
      const refs = detectAndExtractReferences(text);
      expect(refs.length).toBe(1);
      expect(refs[0].author).toBe("Schreiner");
      expect(refs[0].title).toBe("The Race Set before Us");
    });

    it("should extract fields from quoted short reference", () => {
      const text = 'Leyerle, "John Chrysostom," 162.';
      const refs = detectAndExtractReferences(text);
      expect(refs.length).toBe(1);
      expect(refs[0].author).toBe("Leyerle");
      expect(refs[0].title).toBe("John Chrysostom");
    });
  });
});
