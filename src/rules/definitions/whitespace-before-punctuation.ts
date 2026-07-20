import { StyleRule, StyleViolation } from '../types'
import { getParagraphText, findParagraphIndex, getRegionForParagraph, getParagraphSnippet } from '../utils'
import { DocumentRegion } from '../../analysis/sections'
import { DocxParagraph } from '../../docx/types'

export const whitespaceBeforePunctuationRule: StyleRule = {
  id: 'sbl-whitespace-before-punctuation',
  name: 'Whitespace Before Punctuation',
  description: 'Checks for incorrect whitespace before punctuation marks (periods, commas, colons, semicolons, exclamation marks, and question marks).',
  scope: ['body', 'footnote', 'bibliography'],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = []
    const doc = context.document
    const sections = context.sections

    // Matches whitespace followed by:
    // - a comma, colon, semicolon, exclamation, or question mark
    // - OR a period, provided it is not preceded or followed by another period (meaning it is a lone period, not part of an ellipsis).
    const regex = /[\s\u00A0\t]+([,:;!?]|(?<!\.)\.(?!\.))/g

    const processText = (para: DocxParagraph, pIndex?: number, region?: DocumentRegion, footnoteId?: string) => {
      const text = getParagraphText(para)
      if (!text) return

      let match
      regex.lastIndex = 0
      while ((match = regex.exec(text)) !== null) {
        const raw = match[0]
        const punctuation = match[1]
        const index = match.index

        const startSnippet = Math.max(0, index - 15)
        const endSnippet = Math.min(text.length, index + raw.length + 15)
        const snippet = text.substring(startSnippet, endSnippet)

        violations.push({
          ruleId: this.id,
          ruleName: this.name,
          severity: 'warning',
          message: `Incorrect whitespace before punctuation "${punctuation}".`,
          paragraphIndex: pIndex,
          region,
          detail: footnoteId ? `Footnote ID: ${footnoteId}, Snippet: "...${snippet}..."` : `Snippet: "...${snippet}..."`,
          correction: {
            found: raw,
            expected: punctuation
          },
          paragraphSnippet: getParagraphSnippet(text)
        })
      }
    }

    // Process body and bibliography paragraphs
    for (const para of doc.paragraphs) {
      const region = getRegionForParagraph(para, sections)
      if (region === 'body' || region === 'bibliography') {
        const pIndex = findParagraphIndex(para, doc)
        processText(para, pIndex, region)
      }
    }

    // Process footnotes
    for (const footnote of doc.footnotes) {
      for (const para of footnote.paragraphs) {
        processText(para, undefined, 'footnote', String(footnote.id))
      }
    }

    return violations
  }
}

export default whitespaceBeforePunctuationRule
