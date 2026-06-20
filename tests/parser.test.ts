import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { parseDocx } from "../src/docx/parser.js";
import { createMockDocx, writeTempDocx, cleanTempDir } from "./test-utils.js";

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="32"/>
        </w:rPr>
        <w:t>Title of Essay</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>This is paragraph one with a </w:t>
      </w:r>
      <w:r>
        <w:rPr>
          <w:i/>
        </w:rPr>
        <w:t>footnote ref</w:t>
      </w:r>
      <w:r>
        <w:footnoteReference w:id="1"/>
      </w:r>
      <w:r>
        <w:t>.</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri"/>
        <w:sz w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:styleId="Heading1" w:type="paragraph">
    <w:name w:val="heading 1"/>
    <w:rPr>
      <w:b/>
      <w:sz w:val="28"/>
    </w:rPr>
  </w:style>
</w:styles>`;

const footnotesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:footnote w:id="1">
    <w:p>
      <w:r>
        <w:t>This is footnote text.</w:t>
      </w:r>
    </w:p>
  </w:footnote>
</w:footnotes>`;

describe("DOCX Parser", () => {
  let tempFilePath: string;

  beforeAll(async () => {
    const buffer = await createMockDocx(documentXml, stylesXml, footnotesXml);
    tempFilePath = writeTempDocx(buffer, "test_doc.docx");
  });

  afterAll(() => {
    cleanTempDir();
  });

  it("should parse paragraphs and runs with text", async () => {
    const parsed = await parseDocx(tempFilePath);
    expect(parsed.paragraphs.length).toBe(2);
    expect(parsed.paragraphs[0].runs[0].text).toBe("Title of Essay");
    expect(parsed.paragraphs[1].runs.length).toBe(3); // text, italic footnote ref text, dot text
    expect(parsed.paragraphs[1].runs[0].text).toBe("This is paragraph one with a ");
    expect(parsed.paragraphs[1].runs[1].text).toBe("footnote ref");
  });

  it("should extract formatting properties", async () => {
    const parsed = await parseDocx(tempFilePath);
    
    // Paragraph 1
    const p1 = parsed.paragraphs[0];
    expect(p1.properties.styleId).toBe("Heading1");
    expect(p1.properties.alignment).toBe("center");
    expect(p1.runs[0].properties.bold).toBe(true);
    expect(p1.runs[0].properties.fontSize).toBe(32);

    // Paragraph 2, run 2 (italic run)
    const p2 = parsed.paragraphs[1];
    expect(p2.runs[1].properties.italic).toBe(true);
  });

  it("should parse default styles and styles registry", async () => {
    const parsed = await parseDocx(tempFilePath);
    expect(parsed.defaultRunProperties?.fontFamily).toBe("Calibri");
    expect(parsed.defaultRunProperties?.fontSize).toBe(22);

    const heading1Style = parsed.styles.get("Heading1");
    expect(heading1Style).toBeDefined();
    expect(heading1Style?.name).toBe("heading 1");
    expect(heading1Style?.runProperties?.bold).toBe(true);
  });

  it("should parse footnotes", async () => {
    const parsed = await parseDocx(tempFilePath);
    expect(parsed.footnotes.length).toBe(1);
    expect(parsed.footnotes[0].id).toBe(1);
    expect(parsed.footnotes[0].paragraphs[0].runs[0].text).toBe("This is footnote text.");
    expect(parsed.paragraphs[1].footnoteRefs).toContain(1);
  });
});
