import {
  RunProperties,
  ParagraphProperties,
  DocxParagraph,
  DocxRun,
  DocxStyle,
  ParsedDocument
} from './types'

/**
 * Helper to extract paragraph style ID, falling back to 'Normal'/'normal' if not specified.
 */
function getParagraphStyleId(
  paragraph: DocxParagraph,
  styles: Map<string, DocxStyle>
): string | undefined {
  let pStyleId = paragraph.properties.styleId
  if (!pStyleId) {
    if (styles.has('Normal')) {
      pStyleId = 'Normal'
    } else if (styles.has('normal')) {
      pStyleId = 'normal'
    }
  }
  return pStyleId
}

/**
 * Helper to build the style inheritance chain from most specific style up to the base style.
 */
function getStyleChain(
  styleId: string,
  styles: Map<string, DocxStyle>
): DocxStyle[] {
  let currentId: string | undefined = styleId
  const visited = new Set<string>()
  const styleChain: DocxStyle[] = []
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId)
    const style = styles.get(currentId)
    if (!style) break
    styleChain.push(style)
    currentId = style.basedOn
  }
  return styleChain
}

/**
 * Helper to copy a single property in a type-safe manner.
 */
function copyProperty<T, K extends keyof T>(target: T, source: T, key: K) {
  const val = source[key]
  if (val !== undefined) {
    target[key] = val
  }
}

/**
 * Generic helper to merge defined properties from a source object to a target object.
 */
function mergeProperties<T extends object>(target: T, source: T, keys: (keyof T)[]) {
  for (const key of keys) {
    copyProperty(target, source, key)
  }
}

const RUN_KEYS: (keyof RunProperties)[] = [
  'bold',
  'italic',
  'underline',
  'fontSize',
  'fontFamily',
  'color',
  'superscript',
  'subscript',
  'smallCaps',
  'strikethrough'
]

const PARA_KEYS: (keyof ParagraphProperties)[] = [
  'styleId',
  'alignment',
  'lineSpacing',
  'indentation',
  'outlineLevel',
  'keepNext',
  'keepLines',
  'pageBreakBefore'
]

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
  const styles = doc.styles
  const defaults = doc.defaultRunProperties || {}
  const resolved: RunProperties = { ...defaults }

  const pStyleId = getParagraphStyleId(paragraph, styles)

  if (pStyleId) {
    const styleChain = getStyleChain(pStyleId, styles)
    // Apply styles starting from the base style up to the paragraph style
    for (let i = styleChain.length - 1; i >= 0; i--) {
      const styleRunProps = styleChain[i].runProperties
      if (styleRunProps) {
        mergeProperties(resolved, styleRunProps, RUN_KEYS)
      }
    }
  }

  // 4. Run direct properties override styles
  mergeProperties(resolved, run.properties, RUN_KEYS)

  return resolved
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
  const styles = doc.styles
  const defaults = doc.defaultParagraphProperties || {}
  const resolved: ParagraphProperties = { ...defaults }

  const pStyleId = getParagraphStyleId(paragraph, styles)

  if (pStyleId) {
    const styleChain = getStyleChain(pStyleId, styles)
    for (let i = styleChain.length - 1; i >= 0; i--) {
      const styleParaProps = styleChain[i].paragraphProperties
      if (styleParaProps) {
        mergeProperties(resolved, styleParaProps, PARA_KEYS)
      }
    }
  }

  // Direct paragraph properties override
  mergeProperties(resolved, paragraph.properties, PARA_KEYS)

  return resolved
}
