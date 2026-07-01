import { StyleRule, StyleViolation } from '../types'
import { SBL_VALID_ABBREVIATIONS, SBL_BOOK_MAP, COMMON_WRONG_ABBREVIATIONS, SBL_ABBREV_TO_FULL } from '../data/sbl-books'
import { getParagraphText, findParagraphIndex, getRegionForParagraph, getParagraphSnippet } from '../utils'
import { DocumentRegion } from '../../analysis/sections'

// List of all book keys for checking
const ALL_BOOK_NAMES = Array.from(SBL_BOOK_MAP.keys())
  .concat(Array.from(SBL_VALID_ABBREVIATIONS).map(s => s.toLowerCase()))
  .concat(Array.from(COMMON_WRONG_ABBREVIATIONS.keys()))
  .sort((a, b) => b.length - a.length)

const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const bookAlternation = sortedNamesPattern(ALL_BOOK_NAMES)

function sortedNamesPattern(names: string[]): string {
  return names.map(name => escapeRegExp(name)).join('|')
}

function getCanonicalBookName(book: string): string {
  const lower = book.toLowerCase().trim()
  
  // 1. Check if it's in COMMON_WRONG_ABBREVIATIONS
  if (COMMON_WRONG_ABBREVIATIONS.has(lower)) {
    return COMMON_WRONG_ABBREVIATIONS.get(lower)!
  }

  // 2. Check if it's a lowercase version of a valid abbreviation
  for (const abbrev of SBL_VALID_ABBREVIATIONS) {
    if (abbrev.toLowerCase() === lower) {
      return abbrev
    }
  }

  // 3. Check if it's a lowercase version of a full book name
  for (const full of SBL_ABBREV_TO_FULL.values()) {
    if (full.toLowerCase() === lower) {
      return full
    }
  }

  // 4. Default: return the original book as is
  return book
}

export const bibleRefFormatRule: StyleRule = {
  id: 'sbl-bible-ref-format',
  name: 'Bible Reference Format',
  description: "Checks that biblical references are formatted correctly, including spaces, range indicators (en-dash), and the exclusion of 'ch.' or 'v.' in citations.",
  scope: ['body', 'footnote'],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = []
    const doc = context.document
    const sections = context.sections

    // 1. Missing space regex, e.g. Gen1:1 or 1Cor13:1
    const missingSpaceRegex = new RegExp(`\\b(${bookAlternation})(\\d+)`, 'gi')

    // 2. ch./v./vv. usage in citation
    const chUsageRegex = new RegExp(`\\b(${bookAlternation})\\s+(?:ch\\.?|chapter)\\s+(\\d+)`, 'gi')
    const vUsageRegex = new RegExp(
      `\\b(${bookAlternation})\\s+(\\d+)(?:[.:](\\d+))?(?:\\s*,)?\\s+(?:v\\.?|verse|vv\\.?|verses)\\s+(\\d+(?:[–-]\\d+)?)`,
      'gi'
    )

    const processText = (text: string, pIndex: number | undefined, region: DocumentRegion | undefined, footnoteId?: string) => {
      if (region === 'title-page' || region === 'bibliography') {
        return
      }

      // Check missing space
      missingSpaceRegex.lastIndex = 0
      let match
      while ((match = missingSpaceRegex.exec(text)) !== null) {
        const fullMatch = match[0]
        const book = match[1]
        const num = match[2]
        const expected = getCanonicalBookName(book) + ' ' + num
        violations.push({
          ruleId: bibleRefFormatRule.id,
          ruleName: bibleRefFormatRule.name,
          severity: 'error',
          message: 'Missing space in Bible reference',
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

      // Check ch. usage
      chUsageRegex.lastIndex = 0
      while ((match = chUsageRegex.exec(text)) !== null) {
        const fullMatch = match[0]
        const book = match[1]
        const num = match[2]
        const expected = getCanonicalBookName(book) + ' ' + num
        violations.push({
          ruleId: bibleRefFormatRule.id,
          ruleName: bibleRefFormatRule.name,
          severity: 'error',
          message: "Do not use 'ch.' or 'chapter' in Bible citations",
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

      // Check v. / vv. usage
      vUsageRegex.lastIndex = 0
      while ((match = vUsageRegex.exec(text)) !== null) {
        const fullMatch = match[0]
        const book = match[1]
        const chapter = match[2]
        const verse1 = match[3]
        const verse2 = match[4]
        const canonicalBook = getCanonicalBookName(book)
        let expected: string
        if (verse1 !== undefined) {
          expected = `${canonicalBook} ${chapter}:${verse1}, ${verse2}`
        } else {
          expected = `${canonicalBook} ${chapter}:${verse2}`
        }
        violations.push({
          ruleId: bibleRefFormatRule.id,
          ruleName: bibleRefFormatRule.name,
          severity: 'error',
          message: "Do not use 'v.', 'verse', 'vv.', or 'verses' in Bible citations",
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
export default bibleRefFormatRule

