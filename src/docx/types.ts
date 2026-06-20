export interface RunProperties {
  bold?: boolean;
  italic?: boolean;
  underline?: string;        // e.g. "single", "double", "none"
  fontSize?: number;          // half-points (as stored in OOXML)
  fontFamily?: string;
  color?: string;
  superscript?: boolean;
  subscript?: boolean;
  smallCaps?: boolean;
  strikethrough?: boolean;
}

export interface LineSpacing {
  line?: number;              // twips or 240ths of a line
  lineRule?: string;          // "auto" | "exact" | "atLeast"
  before?: number;
  after?: number;
}

export interface Indentation {
  left?: number;
  right?: number;
  firstLine?: number;
  hanging?: number;
}

export interface ParagraphProperties {
  styleId?: string;           // reference to styles.xml
  alignment?: string;         // "left" | "center" | "right" | "both"
  lineSpacing?: LineSpacing;
  indentation?: Indentation;
  outlineLevel?: number;      // heading level (0-8)
  keepNext?: boolean;
  keepLines?: boolean;
  pageBreakBefore?: boolean;
}

export interface DocxRun {
  text: string;
  properties: RunProperties;
}

export interface DocxParagraph {
  runs: DocxRun[];
  properties: ParagraphProperties;
  hasPageBreakBefore: boolean;  // either via pPr or <w:br type="page"/>
  hasImage: boolean;            // contains a drawing/image element
  footnoteRefs: number[];       // footnote IDs referenced in this para
}

export interface DocxFootnote {
  id: number;
  paragraphs: DocxParagraph[];
}

export interface DocxStyle {
  styleId: string;
  name: string;
  type: string;               // "paragraph" | "character" | "table" | "numbering"
  basedOn?: string;
  runProperties?: RunProperties;
  paragraphProperties?: ParagraphProperties;
}

export interface ParsedDocument {
  paragraphs: DocxParagraph[];
  footnotes: DocxFootnote[];
  styles: Map<string, DocxStyle>;
  defaultRunProperties?: RunProperties;
  defaultParagraphProperties?: ParagraphProperties;
}
