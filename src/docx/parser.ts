import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import * as fs from "fs";
import {
  ParsedDocument,
  DocxParagraph,
  DocxRun,
  DocxStyle,
  DocxFootnote,
  RunProperties,
  ParagraphProperties,
  LineSpacing,
  Indentation
} from "./types.js";

// Helper to ensure we always have an array
function ensureArray<T>(val: T | T[] | undefined): T[] {
  if (val === undefined || val === null) return [];
  return Array.isArray(val) ? val : [val];
}

// Helper to parse OpenXML boolean/val flags
function parseVal(el: any): any {
  if (el === undefined || el === null) return undefined;
  // If it's an empty object/element (like <w:b/>), it means true
  if (typeof el === "object" && Object.keys(el).length === 0) return true;
  if (el === "") return true;

  const val = el["@_w:val"];
  if (val === undefined) return true;
  if (val === false || val === 0 || val === "false" || val === "0" || val === "none" || val === "off") {
    return false;
  }
  return val;
}

function getText(wT: any): string {
  if (wT === undefined || wT === null) return "";
  if (typeof wT === "string") return wT;
  if (typeof wT === "number") return String(wT);
  if (typeof wT === "object") {
    if (wT["#text"] !== undefined) {
      return String(wT["#text"]);
    }
  }
  return "";
}

function parseLineSpacing(spacingNode: any): LineSpacing | undefined {
  if (!spacingNode) return undefined;
  const spacing: LineSpacing = {};
  if (spacingNode["@_w:line"] !== undefined) spacing.line = Number(spacingNode["@_w:line"]);
  if (spacingNode["@_w:lineRule"] !== undefined) spacing.lineRule = String(spacingNode["@_w:lineRule"]);
  if (spacingNode["@_w:before"] !== undefined) spacing.before = Number(spacingNode["@_w:before"]);
  if (spacingNode["@_w:after"] !== undefined) spacing.after = Number(spacingNode["@_w:after"]);
  return Object.keys(spacing).length > 0 ? spacing : undefined;
}

function parseIndentation(indNode: any): Indentation | undefined {
  if (!indNode) return undefined;
  const ind: Indentation = {};
  if (indNode["@_w:left"] !== undefined) ind.left = Number(indNode["@_w:left"]);
  if (indNode["@_w:right"] !== undefined) ind.right = Number(indNode["@_w:right"]);
  if (indNode["@_w:firstLine"] !== undefined) ind.firstLine = Number(indNode["@_w:firstLine"]);
  if (indNode["@_w:hanging"] !== undefined) ind.hanging = Number(indNode["@_w:hanging"]);
  return Object.keys(ind).length > 0 ? ind : undefined;
}

function parseRunProperties(rPrNode: any): RunProperties {
  if (!rPrNode) return {};
  const props: RunProperties = {};

  if (rPrNode["w:b"] !== undefined) props.bold = parseVal(rPrNode["w:b"]) === true;
  if (rPrNode["w:i"] !== undefined) props.italic = parseVal(rPrNode["w:i"]) === true;
  if (rPrNode["w:sz"] !== undefined) props.fontSize = Number(rPrNode["w:sz"]["@_w:val"]);
  if (rPrNode["w:color"] !== undefined) props.color = String(rPrNode["w:color"]["@_w:val"]);

  if (rPrNode["w:rFonts"] !== undefined) {
    props.fontFamily = String(
      rPrNode["w:rFonts"]["@_w:ascii"] ||
      rPrNode["w:rFonts"]["@_w:hAnsi"] ||
      rPrNode["w:rFonts"]["@_w:cs"] ||
      ""
    );
  }

  if (rPrNode["w:u"] !== undefined) {
    props.underline = String(rPrNode["w:u"]["@_w:val"] || "single");
  }

  if (rPrNode["w:vertAlign"] !== undefined) {
    const val = String(rPrNode["w:vertAlign"]["@_w:val"]);
    if (val === "superscript") props.superscript = true;
    if (val === "subscript") props.subscript = true;
  }

  if (rPrNode["w:smallCaps"] !== undefined) props.smallCaps = parseVal(rPrNode["w:smallCaps"]) === true;
  if (rPrNode["w:strike"] !== undefined) props.strikethrough = parseVal(rPrNode["w:strike"]) === true;

  return props;
}

function parseParagraphProperties(pPrNode: any): ParagraphProperties {
  if (!pPrNode) return {};
  const props: ParagraphProperties = {};

  if (pPrNode["w:pStyle"] !== undefined) {
    props.styleId = String(pPrNode["w:pStyle"]["@_w:val"]);
  }
  if (pPrNode["w:jc"] !== undefined) {
    props.alignment = String(pPrNode["w:jc"]["@_w:val"]);
  }
  if (pPrNode["w:spacing"] !== undefined) {
    props.lineSpacing = parseLineSpacing(pPrNode["w:spacing"]);
  }
  if (pPrNode["w:ind"] !== undefined) {
    props.indentation = parseIndentation(pPrNode["w:ind"]);
  }
  if (pPrNode["w:outlineLvl"] !== undefined) {
    props.outlineLevel = Number(pPrNode["w:outlineLvl"]["@_w:val"]);
  }
  if (pPrNode["w:keepNext"] !== undefined) {
    props.keepNext = parseVal(pPrNode["w:keepNext"]) === true;
  }
  if (pPrNode["w:keepLines"] !== undefined) {
    props.keepLines = parseVal(pPrNode["w:keepLines"]) === true;
  }
  if (pPrNode["w:pageBreakBefore"] !== undefined) {
    props.pageBreakBefore = parseVal(pPrNode["w:pageBreakBefore"]) === true;
  }

  return props;
}

function parseParagraph(pNode: any): DocxParagraph {
  const pPr = pNode["w:pPr"];
  const properties = parseParagraphProperties(pPr);

  const runs: DocxRun[] = [];
  const footnoteRefs: number[] = [];
  let hasPageBreakBefore = properties.pageBreakBefore === true;
  let hasImage = false;

  // Walk through paragraph contents (w:r, w:hyperlink, w:proofErr, w:fldSimple, etc.)
  // We can recursively traverse the w:p node to extract all runs in document order
  function traverseParagraph(node: any) {
    if (!node || typeof node !== "object") return;

    if (Array.isArray(node)) {
      for (const item of node) {
        traverseParagraph(item);
      }
      return;
    }

    // Process w:r (run)
    if (node["w:r"]) {
      const wRs = ensureArray(node["w:r"]);
      for (const r of wRs) {
        const rPr = r["w:rPr"];
        const runProps = parseRunProperties(rPr);

        // Check if run has text
        let text = "";
        if (r["w:t"] !== undefined) {
          const wTs = ensureArray(r["w:t"]);
          text = wTs.map(t => getText(t)).join("");
        }

        // Check if run contains a break
        if (r["w:br"] !== undefined) {
          const brs = ensureArray(r["w:br"]);
          for (const br of brs) {
            if (br["@_w:type"] === "page") {
              hasPageBreakBefore = true; // wait, if page break is inside run, it breaks *after* this text. But we can mark the paragraph as containing a page break.
            }
          }
        }

        // Check for images
        if (r["w:drawing"] !== undefined || r["w:pict"] !== undefined) {
          hasImage = true;
        }

        // Check for footnote reference
        let runFootnoteId: number | undefined;
        if (r["w:footnoteReference"] !== undefined) {
          const fnRef = r["w:footnoteReference"];
          const refId = Number(fnRef["@_w:id"]);
          if (!isNaN(refId)) {
            footnoteRefs.push(refId);
            runFootnoteId = refId;
          }
        }

        if (text || hasImage || r["w:br"] !== undefined || runFootnoteId !== undefined) {
          runs.push({
            text,
            properties: runProps,
            footnoteId: runFootnoteId
          });
        }
      }
    }

    // Recurse into other nodes (like w:hyperlink) to extract nested runs
    for (const key of Object.keys(node)) {
      if (key !== "w:r" && key !== "w:pPr" && key !== "@_" && key !== "#text") {
        traverseParagraph(node[key]);
      }
    }
  }

  traverseParagraph(pNode);

  const hasPageBreakAfter = pPr && pPr["w:sectPr"] !== undefined;

  return {
    runs,
    properties,
    hasPageBreakBefore,
    hasPageBreakAfter: !!hasPageBreakAfter,
    hasImage,
    footnoteRefs
  };
}

function parseStyles(stylesObj: any): {
  styles: Map<string, DocxStyle>;
  defaultRunProperties?: RunProperties;
  defaultParagraphProperties?: ParagraphProperties;
} {
  const stylesMap = new Map<string, DocxStyle>();
  let defaultRunProperties: RunProperties | undefined;
  let defaultParagraphProperties: ParagraphProperties | undefined;

  if (!stylesObj || !stylesObj["w:styles"]) {
    return { styles: stylesMap };
  }

  const stylesRoot = stylesObj["w:styles"];

  // 1. Parse docDefaults
  if (stylesRoot["w:docDefaults"]) {
    const defaults = stylesRoot["w:docDefaults"];
    if (defaults["w:rPrDefault"] && defaults["w:rPrDefault"]["w:rPr"]) {
      defaultRunProperties = parseRunProperties(defaults["w:rPrDefault"]["w:rPr"]);
    }
    if (defaults["w:pPrDefault"] && defaults["w:pPrDefault"]["w:pPr"]) {
      defaultParagraphProperties = parseParagraphProperties(defaults["w:pPrDefault"]["w:pPr"]);
    }
  }

  // 2. Parse individual styles
  if (stylesRoot["w:style"]) {
    const stylesList = ensureArray(stylesRoot["w:style"]);
    for (const styleNode of stylesList) {
      const styleId = String(styleNode["@_w:styleId"]);
      const name = styleNode["w:name"] ? String(styleNode["w:name"]["@_w:val"]) : "";
      const type = String(styleNode["@_w:type"] || "paragraph");
      const basedOn = styleNode["w:basedOn"] ? String(styleNode["w:basedOn"]["@_w:val"]) : undefined;

      const runProperties = parseRunProperties(styleNode["w:rPr"]);
      const paragraphProperties = parseParagraphProperties(styleNode["w:pPr"]);

      stylesMap.set(styleId, {
        styleId,
        name,
        type,
        basedOn,
        runProperties,
        paragraphProperties
      });
    }
  }

  return {
    styles: stylesMap,
    defaultRunProperties,
    defaultParagraphProperties
  };
}

export async function parseDocx(filePath: string): Promise<ParsedDocument> {
  const fileBuffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(fileBuffer);

  const docXmlFile = zip.file("word/document.xml");
  if (!docXmlFile) {
    throw new Error("Invalid DOCX file: missing word/document.xml");
  }

  const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: true,
    allowBooleanAttributes: true,
    trimValues: false
  });

  const docXmlText = await docXmlFile.async("text");
  const docObj = xmlParser.parse(docXmlText);
  const body = docObj["w:document"]?.["w:body"];
  if (!body) {
    throw new Error("Invalid DOCX structure: missing w:body in word/document.xml");
  }

  // Parse styles.xml if present
  const stylesXmlFile = zip.file("word/styles.xml");
  let stylesMap = new Map<string, DocxStyle>();
  let defaultRunProperties: RunProperties | undefined;
  let defaultParagraphProperties: ParagraphProperties | undefined;

  if (stylesXmlFile) {
    const stylesXmlText = await stylesXmlFile.async("text");
    const stylesObj = xmlParser.parse(stylesXmlText);
    const parsedStyles = parseStyles(stylesObj);
    stylesMap = parsedStyles.styles;
    defaultRunProperties = parsedStyles.defaultRunProperties;
    defaultParagraphProperties = parsedStyles.defaultParagraphProperties;
  }

  // Parse footnotes.xml if present
  const footnotesXmlFile = zip.file("word/footnotes.xml");
  const footnotes: DocxFootnote[] = [];

  if (footnotesXmlFile) {
    const footnotesXmlText = await footnotesXmlFile.async("text");
    const footnotesObj = xmlParser.parse(footnotesXmlText);
    if (footnotesObj["w:footnotes"] && footnotesObj["w:footnotes"]["w:footnote"]) {
      const fnList = ensureArray(footnotesObj["w:footnotes"]["w:footnote"]);
      for (const fnNode of fnList) {
        const id = Number(fnNode["@_w:id"]);
        // Ignore separator and continuationSeparator footnotes (usually negative IDs)
        if (!isNaN(id) && id >= 0) {
          const fnParas: DocxParagraph[] = [];
          if (fnNode["w:p"]) {
            const wPs = ensureArray(fnNode["w:p"]);
            for (const wp of wPs) {
              fnParas.push(parseParagraph(wp));
            }
          }
          footnotes.push({
            id,
            paragraphs: fnParas
          });
        }
      }
    }
  }

  // Collect all paragraphs in document.xml w:body recursively
  const paragraphs: DocxParagraph[] = [];
  
  function collectAllParagraphs(node: any) {
    if (!node || typeof node !== "object") return;

    if (Array.isArray(node)) {
      for (const item of node) {
        collectAllParagraphs(item);
      }
      return;
    }

    if (node["w:p"]) {
      const wPs = ensureArray(node["w:p"]);
      for (const wp of wPs) {
        paragraphs.push(parseParagraph(wp));
      }
    }

    // Recurse into all other keys except w:p to find tables and other structures in order
    for (const key of Object.keys(node)) {
      if (key !== "w:p" && key !== "@_" && key !== "#text") {
        collectAllParagraphs(node[key]);
      }
    }
  }

  collectAllParagraphs(body);

  // Check if any header or footer XML files exist in the zip
  const hasHeaderOrFooter = zip.file(/^word\/(header|footer)\d*\.xml$/).length > 0;

  return {
    paragraphs,
    footnotes,
    styles: stylesMap,
    defaultRunProperties,
    defaultParagraphProperties,
    hasHeaderOrFooter
  };
}
