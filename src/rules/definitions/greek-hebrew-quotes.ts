import { StyleRule, StyleViolation } from '../types'
import { getParagraphText, getRegionForParagraph, getParagraphSnippet } from '../utils'
import { DocumentRegion } from '../../analysis/sections'

const QUOTED_PATTERNS = [
  { regex: /“([^”]+)”/g, open: '“', close: '”' },
  { regex: /‘([^’]+)’/g, open: '‘', close: '’' },
  { regex: /"([^"]+)"/g, open: '"', close: '"' },
  { regex: /'([^']+)'/g, open: "'", close: "'" }
]

const GREEK_HEBREW_CHAR_PATTERN = /[\u0590-\u05FF\uFB1D-\uFB4F\u0370-\u03FF\u1F00-\u1FFF]/
const LATIN_CHAR_PATTERN = /[a-zA-Z]/

export const greekHebrewQuotesRule: StyleRule = {
  id: 'sbl-greek-hebrew-quotes',
  name: 'Greek and Hebrew Quotes Check',
  description: 'Checks that non-transliterated Greek and Hebrew text is not enclosed in quotation marks.',
  scope: ['body', 'footnote'],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = []
    const doc = context.document
    const sections = context.sections

    const processText = (text: string, pIndex: number | undefined, region: DocumentRegion | undefined, footnoteId?: string) => {
      if (region === 'title-page' || region === 'bibliography') {
        return
      }

      for (const { regex } of QUOTED_PATTERNS) {
        regex.lastIndex = 0
        let match
        while ((match = regex.exec(text)) !== null) {
          const rawMatch = match[0] // e.g. “λόγος”
          const innerContent = match[1] // e.g. λόγος

          const hasGreekOrHebrew = GREEK_HEBREW_CHAR_PATTERN.test(innerContent)
          const hasLatin = LATIN_CHAR_PATTERN.test(innerContent)

          if (hasGreekOrHebrew && !hasLatin) {
            // Skip if it is a dictionary/lexicon entry reference (e.g., preceded by "s.v." or "s.vv.")
            const precedingText = text.slice(0, match.index)
            let isDictionaryRef = false
            const refMatches = [...precedingText.matchAll(/\b(s\.?\s*v{1,2}\.?|sub\s+verbo)(?!\w)/gi)]
            if (refMatches.length > 0) {
              const lastMatch = refMatches[refMatches.length - 1]
              if (lastMatch.index !== undefined) {
                const afterRef = precedingText.slice(lastMatch.index + lastMatch[0].length)
                
                // Ensure we only cross separators like spaces, punctuation, quotes, Greek/Hebrew text, and simple conjunctions
                const latinWords = afterRef.match(/[a-zA-Z]+/g) || []
                const allowedConjunctions = new Set(['and', 'or', 'et', 'und'])
                const hasOnlyAllowedConjunctions = latinWords.every(w => allowedConjunctions.has(w.toLowerCase()))
                const hasSentenceBoundary = /[.!?]\s+[A-Z]/.test(afterRef)
                
                if (hasOnlyAllowedConjunctions && !hasSentenceBoundary) {
                  isDictionaryRef = true
                }
              }
            }
            if (isDictionaryRef) {
              continue
            }

            violations.push({
              ruleId: greekHebrewQuotesRule.id,
              ruleName: greekHebrewQuotesRule.name,
              severity: 'error',
              message: 'Greek and Hebrew text must not be inside quote marks',
              paragraphIndex: pIndex,
              region,
              detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
              correction: {
                found: rawMatch,
                expected: innerContent
              },
              paragraphSnippet: getParagraphSnippet(text)
            })
          }
        }
      }
    }

    // Process body paragraphs
    doc.paragraphs.forEach((para, index) => {
      const region = getRegionForParagraph(para, sections)
      const text = getParagraphText(para)
      processText(text, index, region)
    })

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

export default greekHebrewQuotesRule
