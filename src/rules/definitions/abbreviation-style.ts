import { StyleRule, StyleViolation } from '../types'
import { getParagraphText, findParagraphIndex, getRegionForParagraph, isSentenceStart, getParagraphSnippet, isHeading } from '../utils'
import { DocumentRegion } from '../../analysis/sections'
import { detectSblReferences, isWithinReference } from '../sbl-reference-detector'
import { DocxParagraph } from '../../docx/types'

const EXCLUDED_SERIES_TITLES = [
  'New International Commentary on the New Testament',
  'New International Commentary on the Old Testament',
  'New International Greek Testament Commentary',
  'Society for New Testament Studies Monograph Series',
  'Journal for the Study of the New Testament',
  'Journal for the Study of the Old Testament'
]

function isInsideExcludedSeries(text: string, matchIndex: number, matchLength: number): boolean {
  const lowerText = text.toLowerCase()
  for (const series of EXCLUDED_SERIES_TITLES) {
    const lowerSeries = series.toLowerCase()
    let idx = lowerText.indexOf(lowerSeries)
    while (idx !== -1) {
      if (matchIndex >= idx && (matchIndex + matchLength) <= (idx + lowerSeries.length)) {
        return true
      }
      idx = lowerText.indexOf(lowerSeries, idx + 1)
    }
  }
  return false
}

export const abbreviationStyleRule: StyleRule = {
  id: 'sbl-abbreviation-style',
  name: 'Abbreviation Punctuation and Capitalisation',
  description: 'Checks that academic abbreviations (e.g., i.e., cf., et al., etc.) are punctuated and capitalised correctly.',
  scope: ['body', 'footnote'],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = []
    const doc = context.document
    const sections = context.sections

    // Regexes to capture variant abbreviations
    const egRegex = /\b(e\s*\.?\s*g\s*\.?,?)/gi
    const ieRegex = /\b(i\s*\.?\s*e\s*\.?,?)/gi
    const cfRegex = /\b(c\s*\.?\s*f\s*\.?,?)/gi
    const etalRegex = /\b(et\s*\.?\s*al\s*\.?,?)/gi
    const etcRegex = /\b(etc\b\.?)/gi
    const vizRegex = /\b(viz\b\.?)/gi
    const caRegex = /\bca\b(?:\s+\d+)/gi // ca followed by space and digit
    const otRegex = /\bOld\s+Testament\b/gi
    const ntRegex = /\bNew\s+Testament\b/gi

    const processText = (para: DocxParagraph, pIndex: number | undefined, region: DocumentRegion | undefined, footnoteId?: string) => {
      if (region === 'title-page' || region === 'bibliography') {
        return
      }
      if (isHeading(para, context)) {
        return
      }

      const text = getParagraphText(para)
      let match
      const refSpans = footnoteId ? detectSblReferences(text) : []

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
      const insideBold = new Array(text.length).fill(false)
      let charIdx = 0
      for (const run of para.runs) {
        const resolvedProps = context.resolveRunProperties(run, para)
        const italic = resolvedProps.italic === true
        const bold = resolvedProps.bold === true
        for (let rCharIdx = 0; rCharIdx < run.text.length; rCharIdx++) {
          if (charIdx < insideItalics.length) {
            insideItalics[charIdx] = italic
            insideBold[charIdx] = bold
            charIdx += 1
          }
        }
      }

      const isIgnoredAt = (matchIndex: number, matchLength: number): boolean => {
        for (let j = 0; j < matchLength; j++) {
          const idx = matchIndex + j
          if (idx < text.length && (insideQuotes[idx] || insideItalics[idx] || insideBold[idx])) {
            return true
          }
        }
        return false
      }

      // 1. e.g. check
      egRegex.lastIndex = 0
      while ((match = egRegex.exec(text)) !== null) {
        const raw = match[0]
        const index = match.index
        if (isIgnoredAt(index, raw.length)) {
          continue
        }
        if (footnoteId && isWithinReference(index, refSpans)) {
          continue
        }
        const atSentenceStart = isSentenceStart(text, index)
        const correct = atSentenceStart ? 'E.g.,' : 'e.g.,'

        if (raw !== correct) {
          violations.push({
            ruleId: abbreviationStyleRule.id,
            ruleName: abbreviationStyleRule.name,
            severity: 'error',
            message: "Incorrect punctuation or capitalisation for abbreviation 'e.g.'",
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
            correction: {
              found: raw,
              expected: correct
            },
            paragraphSnippet: getParagraphSnippet(text)
          })
        }
      }

      // 2. i.e. check
      ieRegex.lastIndex = 0
      while ((match = ieRegex.exec(text)) !== null) {
        const raw = match[0]
        const index = match.index
        if (isIgnoredAt(index, raw.length)) {
          continue
        }
        if (footnoteId && isWithinReference(index, refSpans)) {
          continue
        }
        const atSentenceStart = isSentenceStart(text, index)
        const correct = atSentenceStart ? 'I.e.,' : 'i.e.,'

        if (raw !== correct) {
          violations.push({
            ruleId: abbreviationStyleRule.id,
            ruleName: abbreviationStyleRule.name,
            severity: 'error',
            message: "Incorrect punctuation or capitalisation for abbreviation 'i.e.'",
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
            correction: {
              found: raw,
              expected: correct
            },
            paragraphSnippet: getParagraphSnippet(text)
          })
        }
      }

      // 3. cf. check
      cfRegex.lastIndex = 0
      while ((match = cfRegex.exec(text)) !== null) {
        const raw = match[0]
        const index = match.index
        if (isIgnoredAt(index, raw.length)) {
          continue
        }
        if (footnoteId && isWithinReference(index, refSpans)) {
          continue
        }
        const atSentenceStart = isSentenceStart(text, index)
        const correct = atSentenceStart ? 'Cf.' : 'cf.'

        if (raw !== correct) {
          violations.push({
            ruleId: abbreviationStyleRule.id,
            ruleName: abbreviationStyleRule.name,
            severity: 'error',
            message: "Incorrect punctuation or capitalisation for abbreviation 'cf.'",
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
            correction: {
              found: raw,
              expected: correct
            },
            paragraphSnippet: getParagraphSnippet(text)
          })
        }
      }

      // 4. et al. check
      etalRegex.lastIndex = 0
      while ((match = etalRegex.exec(text)) !== null) {
        const raw = match[0]
        const index = match.index
        if (isIgnoredAt(index, raw.length)) {
          continue
        }
        if (footnoteId && isWithinReference(index, refSpans)) {
          continue
        }
        const correct = 'et al.'

        if (raw !== correct) {
          violations.push({
            ruleId: abbreviationStyleRule.id,
            ruleName: abbreviationStyleRule.name,
            severity: 'error',
            message: "Incorrect punctuation or capitalisation for abbreviation 'et al.'",
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
            correction: {
              found: raw,
              expected: correct
            },
            paragraphSnippet: getParagraphSnippet(text)
          })
        }
      }

      // 5. etc. check
      etcRegex.lastIndex = 0
      while ((match = etcRegex.exec(text)) !== null) {
        const raw = match[0]
        const index = match.index
        if (isIgnoredAt(index, raw.length)) {
          continue
        }
        if (footnoteId && isWithinReference(index, refSpans)) {
          continue
        }
        if (raw !== 'etc.') {
          violations.push({
            ruleId: abbreviationStyleRule.id,
            ruleName: abbreviationStyleRule.name,
            severity: 'error',
            message: "Incorrect punctuation for abbreviation 'etc.'",
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
            correction: {
              found: raw,
              expected: 'etc.'
            },
            paragraphSnippet: getParagraphSnippet(text)
          })
        }
      }

      // 6. viz. check
      vizRegex.lastIndex = 0
      while ((match = vizRegex.exec(text)) !== null) {
        const raw = match[0]
        const index = match.index
        if (isIgnoredAt(index, raw.length)) {
          continue
        }
        if (footnoteId && isWithinReference(index, refSpans)) {
          continue
        }
        if (raw !== 'viz.') {
          violations.push({
            ruleId: abbreviationStyleRule.id,
            ruleName: abbreviationStyleRule.name,
            severity: 'error',
            message: "Incorrect punctuation for abbreviation 'viz.'",
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
            correction: {
              found: raw,
              expected: 'viz.'
            },
            paragraphSnippet: getParagraphSnippet(text)
          })
        }
      }

      // 7. ca. check
      caRegex.lastIndex = 0
      while ((match = caRegex.exec(text)) !== null) {
        const raw = match[0] // e.g. "ca 1500"
        const index = match.index
        if (isIgnoredAt(index, raw.length)) {
          continue
        }
        if (footnoteId && isWithinReference(index, refSpans)) {
          continue
        }
        const correct = raw.startsWith('Ca') ? 'Ca.' + raw.substring(2) : 'ca.' + raw.substring(2)
        violations.push({
          ruleId: abbreviationStyleRule.id,
          ruleName: abbreviationStyleRule.name,
          severity: 'error',
          message: "Incorrect punctuation for abbreviation 'ca.'",
          paragraphIndex: pIndex,
          region,
          detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
          correction: {
            found: raw,
            expected: correct
          },
          paragraphSnippet: getParagraphSnippet(text)
        })
      }

      // 8. Old Testament check
      otRegex.lastIndex = 0
      while ((match = otRegex.exec(text)) !== null) {
        const raw = match[0]
        const idx = match.index
        if (isIgnoredAt(idx, raw.length)) {
          continue
        }
        if (isInsideExcludedSeries(text, idx, raw.length)) {
          continue
        }
        if (footnoteId && isWithinReference(idx, refSpans)) {
          continue
        }
        violations.push({
          ruleId: abbreviationStyleRule.id,
          ruleName: abbreviationStyleRule.name,
          severity: 'error',
          message: "Use abbreviation 'OT' for 'Old Testament'",
          paragraphIndex: pIndex,
          region,
          detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
          correction: {
            found: raw,
            expected: 'OT'
          },
          paragraphSnippet: getParagraphSnippet(text)
        })
      }

      // 9. New Testament check
      ntRegex.lastIndex = 0
      while ((match = ntRegex.exec(text)) !== null) {
        const raw = match[0]
        const idx = match.index
        if (isIgnoredAt(idx, raw.length)) {
          continue
        }
        if (isInsideExcludedSeries(text, idx, raw.length)) {
          continue
        }
        if (footnoteId && isWithinReference(idx, refSpans)) {
          continue
        }
        violations.push({
          ruleId: abbreviationStyleRule.id,
          ruleName: abbreviationStyleRule.name,
          severity: 'error',
          message: "Use abbreviation 'NT' for 'New Testament'",
          paragraphIndex: pIndex,
          region,
          detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
          correction: {
            found: raw,
            expected: 'NT'
          },
          paragraphSnippet: getParagraphSnippet(text)
        })
      }
    }

    // Process body paragraphs
    for (const para of doc.paragraphs) {
      const pIndex = findParagraphIndex(para, doc)
      const region = getRegionForParagraph(para, sections)
      processText(para, pIndex, region)
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
export default abbreviationStyleRule

