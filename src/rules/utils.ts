import type { DocxParagraph, ParsedDocument } from '../docx/types'
import type { RuleContext } from './types'
import type { DocumentSections, DocumentRegion } from '../analysis/sections'

/**
 * Concatenates all run text from a paragraph
 */
export function getParagraphText(para: DocxParagraph): string {
  return para.runs.map(r => r.text).join('')
}

/**
 * Checks if a paragraph is a heading (has outlineLevel or style indicating heading)
 */
export function isHeading(para: DocxParagraph, context: RuleContext): boolean {
  const resolved = context.resolveParagraphProperties(para)

  if (resolved.outlineLevel !== undefined && resolved.outlineLevel >= 0 && resolved.outlineLevel <= 8) {
    return true
  }

  const styleId = resolved.styleId
  if (styleId) {
    const style = context.document.styles.get(styleId)
    if (style && style.name && style.name.toLowerCase().includes('heading')) {
      return true
    }
  }

  return false
}

/**
 * Finds the index of a paragraph within doc.paragraphs by identity
 */
export function findParagraphIndex(para: DocxParagraph, doc: ParsedDocument): number {
  return doc.paragraphs.indexOf(para)
}

/**
 * Gets the document region for a given paragraph reference
 */
export function getRegionForParagraph(para: DocxParagraph, sections: DocumentSections): DocumentRegion {
  if (sections.titlePage.includes(para)) {
    return 'title-page'
  }
  if (sections.bibliography.includes(para)) {
    return 'bibliography'
  }
  return 'body'
}

/**
 * Checks if a character position is inside parentheses
 */
export function isInsideParentheses(text: string, index: number): boolean {
  let parenDepth = 0
  for (let i = 0; i < index; i++) {
    if (text[i] === '(') {
      parenDepth += 1
    } else if (text[i] === ')') {
      parenDepth -= 1
    }
  }
  if (parenDepth > 0) {
    const afterText = text.substring(index)
    if (afterText.includes(')')) {
      return true
    }
  }
  return false
}

/**
 * Checks if a character position follows sentence-ending punctuation
 */
export function isSentenceStart(text: string, index: number): boolean {
  if (index === 0) return true
  const precedingAll = text.substring(0, index)
  if (precedingAll.trim() === '') return true

  const preceding = text.substring(Math.max(0, index - 4), index)
  return /[.!?]\s+$/.test(preceding) || /[.!?]"\s+$/.test(preceding) || /[.!?]'\s+$/.test(preceding)
}

/**
 * Gets a truncated snippet of paragraph text for location context
 */
export function getParagraphSnippet(text: string, maxLength = 40): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength) + '…'
}

