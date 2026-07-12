import { StyleRule, StyleViolation } from '../types'
import { getParagraphText, findParagraphIndex, getRegionForParagraph, getParagraphSnippet } from '../utils'
import { DocumentRegion } from '../../analysis/sections'
import { DocxParagraph } from '../../docx/types'

export const multipleWhitespacesRule: StyleRule = {
  id: 'format-multiple-whitespaces',
  name: 'Multiple Consecutive Whitespaces',
  description: 'Verifies that the document does not contain multiple consecutive whitespaces (spaces, tabs, and non-breaking spaces).',
  scope: ['body', 'footnote', 'bibliography'],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = []
    const doc = context.document
    const sections = context.sections

    const whitespaceRegex = /[ \t\u00A0]{2,}/g

    const processText = (para: DocxParagraph, pIndex?: number, region?: DocumentRegion, footnoteId?: string) => {
      const text = getParagraphText(para)
      if (!text) return

      let match
      whitespaceRegex.lastIndex = 0
      while ((match = whitespaceRegex.exec(text)) !== null) {
        const raw = match[0]
        const index = match.index

        const startSnippet = Math.max(0, index - 15)
        const endSnippet = Math.min(text.length, index + raw.length + 15)
        const snippet = text.substring(startSnippet, endSnippet)

        violations.push({
          ruleId: this.id,
          ruleName: this.name,
          severity: 'warning',
          message: 'Multiple consecutive whitespaces detected.',
          paragraphIndex: pIndex,
          region,
          detail: footnoteId ? `Footnote ID: ${footnoteId}, Snippet: "...${snippet}..."` : `Snippet: "...${snippet}..."`,
          correction: {
            found: raw,
            expected: ' '
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
        processText(para, undefined, undefined, String(footnote.id))
      }
    }

    return violations
  }
}

export default multipleWhitespacesRule
