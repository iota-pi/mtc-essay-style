import { StyleRule, StyleViolation } from '../types'
import { SBL_BOOK_MAP, COMMON_WRONG_ABBREVIATIONS, SBL_VALID_ABBREVIATIONS } from '../data/sbl-books'
import { getParagraphText, findParagraphIndex, getRegionForParagraph, getParagraphSnippet } from '../utils'
import { DocumentRegion } from '../../analysis/sections'

// List of all book keys for matching
const ALL_BOOKS = Array.from(SBL_BOOK_MAP.keys())
  .concat(Array.from(SBL_VALID_ABBREVIATIONS).map(s => s.toLowerCase()))
  .concat(Array.from(COMMON_WRONG_ABBREVIATIONS.keys()))
  .sort((a, b) => b.length - a.length)

const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const bookAlternation = ALL_BOOKS.map(name => escapeRegExp(name)).join('|')

// Regex to capture Bible references with hyphens in ranges
// e.g. Gen 1:1-3, Gen 1-2, 1 Cor 13:1-14:3
const RANGE_HYPHEN_REGEX = new RegExp(
  `\\b(${bookAlternation})\\s+\\d+(?:[.:]\\d+)?(?:\\s*-\\s*\\d+)+(?:[.:]\\d+)?`,
  'gi'
)

export const bibleRangeEndashRule: StyleRule = {
  id: 'sbl-bible-range-endash',
  name: 'Bible Range Dash Check',
  description: 'Checks that chapter and verse ranges in Bible references use an en-dash (–) instead of a hyphen (-).',
  scope: ['body', 'footnote'],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = []
    const doc = context.document
    const sections = context.sections

    const processText = (text: string, pIndex: number | undefined, region: DocumentRegion | undefined, footnoteId?: string) => {
      if (region === 'title-page' || region === 'bibliography') {
        return
      }

      RANGE_HYPHEN_REGEX.lastIndex = 0
      let match
      while ((match = RANGE_HYPHEN_REGEX.exec(text)) !== null) {
        const fullMatch = match[0]
        if (fullMatch.includes('-')) {
          const expected = fullMatch.replace(/-/g, '–')
          violations.push({
            ruleId: bibleRangeEndashRule.id,
            ruleName: bibleRangeEndashRule.name,
            severity: 'error',
            message: 'Use an en-dash (–) instead of a hyphen (-) for ranges in Bible references',
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
            correction: {
              found: fullMatch,
              expected
            },
            paragraphSnippet: getParagraphSnippet(text)
          })
        }
      }
    }

    // Process body paragraphs
    for (const para of doc.paragraphs) {
      const text = getParagraphText(para)
      const pIndex = findParagraphIndex(para, doc)
      const region = getRegionForParagraph(para, sections)
      processText(text, pIndex, region)
    }

    // Process footnotes
    for (const footnote of doc.footnotes) {
      for (const para of footnote.paragraphs) {
        const text = getParagraphText(para)
        processText(text, undefined, undefined, String(footnote.id))
      }
    }

    return violations
  }
}
export default bibleRangeEndashRule

