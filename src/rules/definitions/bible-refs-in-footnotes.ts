import { StyleRule, StyleViolation } from '../types'
import { BIBLE_BOOK_PATTERN } from '../data/sbl-books'
import { getParagraphText } from '../utils'
import { detectSblReferences, isWithinReference } from '../sbl-reference-detector'

// Regex for bible references: a book name/abbreviation, followed by space, followed by a chapter and/or verse number
// e.g. Gen 1, Gen 1:1, Gen 1.1, 1 Cor 13, Ps 23:1-6
const BIBLE_REF_REGEX = new RegExp(
  `(?:${BIBLE_BOOK_PATTERN.source})\\s+\\d+(?:[.:]\\d+)?(?:\\s*[-–]\\s*\\d+)?`,
  'gi'
)

export const bibleRefsInFootnotesRule: StyleRule = {
  id: 'sbl-bible-refs-in-footnotes',
  name: 'Bible References in Footnotes',
  description: 'Checks that biblical references are inline in the text rather than in footnotes.',
  scope: ['footnote'],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = []
    const doc = context.document

    for (const footnote of doc.footnotes) {
      for (let i = 0; i < footnote.paragraphs.length; i++) {
        const para = footnote.paragraphs[i]
        const text = getParagraphText(para)
        const refSpans = detectSblReferences(text)

        // Build insideQuotes map
        const insideQuotes = new Array(text.length).fill(false)
        let doubleQuoteOpen = false
        let singleQuoteOpen = false

        for (let idx = 0; idx < text.length; idx++) {
          const c = text[idx]

          if (c === '“') {
            doubleQuoteOpen = true
          } else if (c === '”') {
            doubleQuoteOpen = false
          } else if (c === '‘') {
            singleQuoteOpen = true
          } else if (c === '’') {
            const isApostrophe = (idx > 0 && /\w/.test(text[idx-1])) && (idx < text.length - 1 && /\w/.test(text[idx+1]))
            if (!isApostrophe) {
              singleQuoteOpen = false
            }
          } else if (c === '"') {
            doubleQuoteOpen = !doubleQuoteOpen
          } else if (c === '\'') {
            const isApostrophe = (idx > 0 && /\w/.test(text[idx-1])) && (idx < text.length - 1 && /\w/.test(text[idx+1]))
            if (!isApostrophe) {
              singleQuoteOpen = !singleQuoteOpen
            }
          }

          insideQuotes[idx] = doubleQuoteOpen || singleQuoteOpen
        }

        // Build insideItalics map
        const insideItalics = new Array(text.length).fill(false)
        let charIdx = 0
        for (const run of para.runs) {
          const resolvedProps = context.resolveRunProperties(run, para)
          const italic = resolvedProps.italic === true
          for (let rCharIdx = 0; rCharIdx < run.text.length; rCharIdx++) {
            if (charIdx < insideItalics.length) {
              insideItalics[charIdx] = italic
              charIdx += 1
            }
          }
        }

        // Find matches
        BIBLE_REF_REGEX.lastIndex = 0
        let match
        while ((match = BIBLE_REF_REGEX.exec(text)) !== null) {
          const matchedText = match[0]
          const matchStart = match.index
          const matchLength = matchedText.length

          let isIgnored = false
          for (let j = 0; j < matchLength; j++) {
            const idx = matchStart + j
            if (idx < text.length && (insideQuotes[idx] || insideItalics[idx])) {
              isIgnored = true
              break
            }
          }

          if (!isIgnored) {
            for (let j = 0; j < matchLength; j++) {
              const idx = matchStart + j
              if (isWithinReference(idx, refSpans)) {
                isIgnored = true
                break
              }
            }
          }

          if (isIgnored) {
            continue
          }

          violations.push({
            ruleId: this.id,
            ruleName: this.name,
            severity: 'error',
            message: `Footnote contains Bible reference "${matchedText}". SBL v2 requires biblical references to be inline in the body text.`,
            paragraphIndex: undefined, // Footnote paragraphs don't map to main document paragraphs index
            region: undefined,
            detail: `Footnote ID: ${footnote.id}, Text: "${text}"`
          })
        }
      }
    }

    return violations
  }
}
export default bibleRefsInFootnotesRule
