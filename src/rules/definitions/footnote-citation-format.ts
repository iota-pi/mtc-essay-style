import { StyleRule, StyleViolation } from '../types'
import { getParagraphText, getParagraphSnippet } from '../utils'
import { detectSblReferences } from '../sbl-reference-detector'
import { parseBibliography } from '../../analysis/bibliography-parser'

export const footnoteCitationFormatRule: StyleRule = {
  id: 'sbl-footnote-citation-format',
  name: 'SBL Footnote Citation Format',
  description: 'Warns about footnote segments that are suspected to be citations but do not match the correct SBL reference format.',
  scope: ['footnote'],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = []
    const doc = context.document
    const sections = context.sections

    const bibSurnames = new Set<string>()
    if (sections.hasBibliography) {
      const bibEntries = parseBibliography(sections.bibliography)
      for (const entry of bibEntries) {
        if (entry.authors) {
          const surname = extractSurnameFromBibAuthors(entry.authors)
          if (surname) {
            bibSurnames.add(surname.toLowerCase())
          }
        }
      }
    }

    const citationCues = [
      /\(\d{4}\)/,
      /\([^)]+:\s*[^)]*?\d{4}\)/,
      /["“][^”"]+?["”],\s+\d+/,
      /^[A-Z][A-Za-z]+,\s+["“][^”"]+?["”]/,
      /^[A-Z][a-zA-Z\s.\-–]+,\s+[^,\n]+\s+\d+/
    ]

    for (const footnote of doc.footnotes) {
      for (const para of footnote.paragraphs) {
        const text = getParagraphText(para)
        const refSpans = detectSblReferences(text)
        const segments = getFootnoteSegments(text)

        for (const seg of segments) {
          const trimmed = seg.text.trim()
          if (!trimmed) continue

          const hasValidMatch = refSpans.some(span => {
            return (span.start >= seg.start && span.start < seg.end) ||
                   (span.end > seg.start && span.end <= seg.end)
          })

          if (hasValidMatch) {
            continue
          }

          const isIbidVariant = /^(?:ibid|ibidem|ib|id)\b/i.test(trimmed)

          const firstWord = trimmed.split(/\s+/)[0].replace(/[.,]/g, '').toLowerCase()
          const startsWithBibAuthor = bibSurnames.has(firstWord)

          const startsWithCapital = /^[A-Z]/.test(trimmed)
          const hasCitationCue = citationCues.some(regex => regex.test(trimmed))

          let suspectReason = ''
          if (isIbidVariant) {
            suspectReason = 'Footnote segment looks like a citation because it contains an "Ibid" variant, but it is incorrectly formatted (e.g. missing period).'
          } else if (startsWithBibAuthor) {
            suspectReason = `Footnote segment starts with bibliography author surname "${firstWord}", indicating it is likely a citation, but it does not match the expected SBL reference format.`
          } else if (startsWithCapital && hasCitationCue) {
            suspectReason = 'Footnote segment appears to be a citation based on content (e.g., publication info, quoted title, or author name), but it does not match the expected SBL reference format.'
          }

          if (suspectReason) {
            violations.push({
              ruleId: this.id,
              ruleName: this.name,
              severity: 'warning',
              message: `${suspectReason} Found: "${getParagraphSnippet(trimmed, 60)}"`,
              detail: `Footnote ID: ${footnote.id}, Full segment text: "${trimmed}"`,
              paragraphSnippet: getParagraphSnippet(text)
            })
          }
        }
      }
    }

    return violations
  }
}

function extractSurnameFromBibAuthors(authors: string | undefined): string {
  if (!authors) return ''
  const firstComma = authors.indexOf(',')
  if (firstComma !== -1) {
    return authors.substring(0, firstComma).trim()
  }
  const parts = authors.split(/\s+/).filter(p => p.length > 0)
  if (parts.length > 0) {
    return parts[0].replace(/[.,]/g, '').trim()
  }
  return ''
}

function getFootnoteSegments(text: string): { text: string; start: number; end: number }[] {
  const separators: number[] = []
  let parenDepth = 0
  let inDoubleQuotes = false
  let inSingleQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '(') {
      parenDepth++
    } else if (c === ')') {
      if (parenDepth > 0) parenDepth--
    } else if (c === '“' || c === '”' || c === '"') {
      inDoubleQuotes = !inDoubleQuotes
    } else if (c === '‘' || c === '’' || c === '\'') {
      const isApostrophe = (i > 0 && /\w/.test(text[i - 1])) && (i < text.length - 1 && /\w/.test(text[i + 1]))
      if (!isApostrophe) {
        inSingleQuotes = !inSingleQuotes
      }
    } else if (c === ';' && parenDepth === 0 && !inDoubleQuotes && !inSingleQuotes) {
      separators.push(i)
    }
  }

  const segments: { text: string; start: number; end: number }[] = []
  let lastIdx = 0
  for (const sep of separators) {
    segments.push({
      text: text.substring(lastIdx, sep),
      start: lastIdx,
      end: sep
    })
    lastIdx = sep + 1
  }
  segments.push({
    text: text.substring(lastIdx),
    start: lastIdx,
    end: text.length
  })
  return segments
}

export default footnoteCitationFormatRule
