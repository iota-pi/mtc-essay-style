import { ParsedDocument, DocxParagraph } from "../docx/types.js";

export type DocumentRegion = "title-page" | "body" | "bibliography";

export interface DocumentSections {
  titlePage: DocxParagraph[];    // empty if no title page detected
  body: DocxParagraph[];
  bibliography: DocxParagraph[]; // empty if no bibliography detected
  hasTitlePage: boolean;
  hasBibliography: boolean;
}

const BIBLIOGRAPHY_HEADINGS = new Set([
  "bibliography",
  "references",
  "works cited",
  "reference list",
  "bibliography of sources cited"
]);

function getParagraphText(para: DocxParagraph): string {
  return para.runs.map(r => r.text).join("").trim();
}

export function classifySections(doc: ParsedDocument): DocumentSections {
  const paragraphs = doc.paragraphs;
  
  // 1. Determine page index for each paragraph
  const paragraphPages: number[] = [];
  let currentPage = 1;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    if (para.properties.pageBreakBefore) {
      currentPage++;
    }
    paragraphPages[i] = currentPage;
    
    // If paragraph has page break in runs, the NEXT paragraph starts on new page
    const runHasPageBreak = para.hasPageBreakBefore && !para.properties.pageBreakBefore;
    if (runHasPageBreak) {
      currentPage++;
    }
  }

  // 2. Detect title page (page 1)
  let hasTitlePage = false;
  const page1Paras: DocxParagraph[] = [];
  
  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphPages[i] === 1) {
      page1Paras.push(paragraphs[i]);
      const text = getParagraphText(paragraphs[i]).toLowerCase();
      if (text.includes("cover sheet") || paragraphs[i].hasImage) {
        hasTitlePage = true;
      }
    }
  }

  // 3. Detect bibliography from the end backwards
  let bibStartIndex = -1;
  for (let i = paragraphs.length - 1; i >= 0; i--) {
    const text = getParagraphText(paragraphs[i]).toLowerCase().replace(/[:.]/g, "").trim();
    if (BIBLIOGRAPHY_HEADINGS.has(text)) {
      bibStartIndex = i;
      break;
    }
  }

  const hasBibliography = bibStartIndex !== -1;

  // 4. Partition paragraphs into regions
  const titlePageList: DocxParagraph[] = [];
  const bodyList: DocxParagraph[] = [];
  const bibliographyList: DocxParagraph[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const isPage1 = paragraphPages[i] === 1;

    if (hasBibliography && i >= bibStartIndex) {
      bibliographyList.push(para);
    } else if (hasTitlePage && isPage1) {
      titlePageList.push(para);
    } else {
      bodyList.push(para);
    }
  }

  return {
    titlePage: titlePageList,
    body: bodyList,
    bibliography: bibliographyList,
    hasTitlePage,
    hasBibliography
  };
}
