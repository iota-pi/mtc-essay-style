import { StyleRule, StyleViolation } from '../types'
import { getParagraphText, findParagraphIndex, getRegionForParagraph, getParagraphSnippet } from '../utils'
import { RANGE_HYPHEN_REGEX } from './bible-range-endash'
import { DocumentRegion } from '../../analysis/sections'

export const bodyEndashRule: StyleRule = {
  id: 'format-body-endash',
  name: 'Body Text En-dash Check',
  description: 'Checks that en-dashes (–) are not used in the body text except to indicate ranges between numbers, and checks that digit ranges use en-dashes instead of hyphens.',
  scope: ['body', 'footnote', 'bibliography'],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = []
    const doc = context.document
    const sections = context.sections

    const processText = (text: string, pIndex: number | undefined, region: DocumentRegion | undefined, footnoteId?: string) => {
      if (region === 'title-page') {
        return
      }

      // 1. Check for incorrect en-dashes (not between digits)
      const endashRegex = /–/g
      let match
      while ((match = endashRegex.exec(text)) !== null) {
        const index = match.index

        const beforeSubstring = text.substring(0, index)
        const endsWithDigit = /\d\s*$/.test(beforeSubstring)

        const afterSubstring = text.substring(index + 1)
        const startsWithDigit = /^\s*\d/.test(afterSubstring)

        const isValidRange = endsWithDigit && startsWithDigit

        if (!isValidRange) {
          const startSnippet = Math.max(0, index - 15)
          const endSnippet = Math.min(text.length, index + 16)
          const snippet = text.substring(startSnippet, endSnippet)

          violations.push({
            ruleId: this.id,
            ruleName: this.name,
            severity: 'warning',
            message: 'En-dash (–) used incorrectly in text. En-dashes should only be used between numbers to indicate a range; use an em-dash (—) or hyphen (-) for other punctuation purposes.',
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}, Snippet: "...${snippet}..."` : `Snippet: "...${snippet}..."`,
            paragraphSnippet: getParagraphSnippet(text)
          })
        }
      }

      // 2. Check for hyphens used instead of en-dashes for digit ranges (non-Bible)
      // First, get all Bible reference hyphen-range ranges to exclude them
      const bibleRanges: { start: number; end: number }[] = []
      RANGE_HYPHEN_REGEX.lastIndex = 0
      while ((match = RANGE_HYPHEN_REGEX.exec(text)) !== null) {
        bibleRanges.push({ start: match.index, end: match.index + match[0].length })
      }

      const hyphenRangeRegex = /\b(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\b/g
      hyphenRangeRegex.lastIndex = 0
      while ((match = hyphenRangeRegex.exec(text)) !== null) {
        const index = match.index
        const fullMatch = match[0]

        // Exclude if preceded or followed by another hyphen-separated digit (e.g. ISBN or phone number sequence)
        const beforeStr = text.substring(0, index)
        const isPrecededByHyphen = /-\s*$/.test(beforeStr)

        const afterStr = text.substring(index + fullMatch.length)
        const isFollowedByHyphen = /^\s*-/.test(afterStr)

        if (isPrecededByHyphen || isFollowedByHyphen) {
          continue
        }

        // Exclude if it falls within an identified Bible reference range
        const isBibleRef = bibleRanges.some(br => index >= br.start && index < br.end)
        if (isBibleRef) {
          continue
        }

        const startSnippet = Math.max(0, index - 15)
        const endSnippet = Math.min(text.length, index + fullMatch.length + 15)
        const snippet = text.substring(startSnippet, endSnippet)

        const expected = `${match[1]}–${match[2]}`

        violations.push({
          ruleId: this.id,
          ruleName: this.name,
          severity: 'warning',
          message: 'Use an en-dash (–) instead of a hyphen (-) for digit ranges (such as page ranges or years)',
          paragraphIndex: pIndex,
          region,
          detail: footnoteId ? `Footnote ID: ${footnoteId}, Snippet: "...${snippet}..."` : `Snippet: "...${snippet}..."`,
          correction: {
            found: fullMatch,
            expected
          },
          paragraphSnippet: getParagraphSnippet(text)
        })
      }
    }

    // Process body paragraphs
    for (const para of doc.paragraphs) {
      const region = getRegionForParagraph(para, sections)
      if (region === 'body' || region === 'bibliography') {
        const pIndex = findParagraphIndex(para, doc)
        processText(getParagraphText(para), pIndex, region)
      }
    }

    // Process footnotes
    for (const footnote of doc.footnotes) {
      for (const para of footnote.paragraphs) {
        processText(getParagraphText(para), undefined, 'footnote', String(footnote.id))
      }
    }

    return violations
  }
}
export default bodyEndashRule
