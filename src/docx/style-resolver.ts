import {
  RunProperties,
  ParagraphProperties,
  DocxParagraph,
  DocxRun,
  DocxStyle,
  ParsedDocument
} from "./types.js";

/**
 * Resolves a property from a style hierarchy.
 * Traverses the `basedOn` chain of styles.
 */
function getStyleProperty<K extends keyof RunProperties>(
  styleId: string | undefined,
  styles: Map<string, DocxStyle>,
  propKey: K
): RunProperties[K] | undefined {
  let currentId = styleId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const style = styles.get(currentId);
    if (!style) break;

    const val = style.runProperties?.[propKey];
    if (val !== undefined) {
      return val;
    }
    currentId = style.basedOn;
  }
  return undefined;
}

function getParagraphStyleProperty<K extends keyof ParagraphProperties>(
  styleId: string | undefined,
  styles: Map<string, DocxStyle>,
  propKey: K
): ParagraphProperties[K] | undefined {
  let currentId = styleId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const style = styles.get(currentId);
    if (!style) break;

    const val = style.paragraphProperties?.[propKey];
    if (val !== undefined) {
      return val;
    }
    currentId = style.basedOn;
  }
  return undefined;
}

/**
 * Resolves effective RunProperties for a given run within a paragraph.
 * Hierarchy:
 * 1. Document Defaults
 * 2. Paragraph style (including basedOn chain)
 * 3. Paragraph direct properties (if any w:rPr is in w:pPr)
 * 4. Run style (including basedOn chain)
 * 5. Run direct properties
 */
export function resolveRunProperties(
  run: DocxRun,
  paragraph: DocxParagraph,
  doc: ParsedDocument
): RunProperties {
  const styles = doc.styles;
  const defaults = doc.defaultRunProperties || {};
  const resolved: RunProperties = { ...defaults };

  const keys: (keyof RunProperties)[] = [
    "bold",
    "italic",
    "underline",
    "fontSize",
    "fontFamily",
    "color",
    "superscript",
    "subscript",
    "smallCaps",
    "strikethrough"
  ];

  // 2. Paragraph style properties
  const pStyleId = paragraph.properties.styleId;
  if (pStyleId) {
    for (const key of keys) {
      const val = getStyleProperty(pStyleId, styles, key);
      if (val !== undefined) {
        resolved[key] = val as any;
      }
    }
  }

  // 3. Paragraph direct run properties (if any, although uncommon, it's possible)
  // (In our simplified parser, we won't extract direct run properties from w:pPr for simplicity,
  // but if needed they'd be merged here.)

  // 4. Run style properties (if the run specifies a style w:rStyle)
  // Let's check if the run's properties contains a styleId (we can add it if needed, or check properties)
  // Wait, in types.ts we didn't specify runStyleId, but we can store it or just resolve direct properties.
  // Standard DOCX has run style in w:rPr -> w:rStyle. Let's make sure our parser captures it or we handle direct run properties.
  // Direct run properties override styles.
  for (const key of keys) {
    const directVal = run.properties[key];
    if (directVal !== undefined) {
      resolved[key] = directVal as any;
    }
  }

  return resolved;
}

/**
 * Resolves effective ParagraphProperties for a paragraph.
 * Hierarchy:
 * 1. Document Defaults
 * 2. Paragraph style (including basedOn chain)
 * 3. Paragraph direct properties
 */
export function resolveParagraphProperties(
  paragraph: DocxParagraph,
  doc: ParsedDocument
): ParagraphProperties {
  const styles = doc.styles;
  const defaults = doc.defaultParagraphProperties || {};
  const resolved: ParagraphProperties = { ...defaults };

  const pKeys: (keyof ParagraphProperties)[] = [
    "styleId",
    "alignment",
    "lineSpacing",
    "indentation",
    "outlineLevel",
    "keepNext",
    "keepLines",
    "pageBreakBefore"
  ];

  const pStyleId = paragraph.properties.styleId;
  if (pStyleId) {
    for (const key of pKeys) {
      const val = getParagraphStyleProperty(pStyleId, styles, key);
      if (val !== undefined) {
        resolved[key] = val as any;
      }
    }
  }

  // Direct paragraph properties override
  for (const key of pKeys) {
    const directVal = paragraph.properties[key];
    if (directVal !== undefined) {
      resolved[key] = directVal as any;
    }
  }

  return resolved;
}
