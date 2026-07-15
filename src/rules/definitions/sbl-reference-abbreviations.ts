import { StyleRule, StyleViolation } from '../types'
import { DocxParagraph } from '../../docx/types'
import {
  getParagraphText,
  getRegionForParagraph,
  isInsideParentheses,
  isSentenceStart,
  getParagraphSnippet,
} from '../utils'
import { DocumentRegion } from '../../analysis/sections'

interface RefTerm {
  singularWord: string;
  pluralWord: string;
  singularAbbrev: string;
  pluralAbbrev: string;
}

const TERMS: RefTerm[] = [
  { singularWord: 'verse', pluralWord: 'verses', singularAbbrev: 'v.', pluralAbbrev: 'vv.' },
  { singularWord: 'chapter', pluralWord: 'chapters', singularAbbrev: 'ch.', pluralAbbrev: 'chs.' },
  { singularWord: 'page', pluralWord: 'pages', singularAbbrev: 'p.', pluralAbbrev: 'pp.' },
  { singularWord: 'column', pluralWord: 'columns', singularAbbrev: 'col.', pluralAbbrev: 'cols.' },
  { singularWord: 'note', pluralWord: 'notes', singularAbbrev: 'n.', pluralAbbrev: 'nn.' },
  { singularWord: 'number', pluralWord: 'numbers', singularAbbrev: 'no.', pluralAbbrev: 'nos.' },
  { singularWord: 'volume', pluralWord: 'volumes', singularAbbrev: 'vol.', pluralAbbrev: 'vols.' },
  { singularWord: 'figure', pluralWord: 'figures', singularAbbrev: 'fig.', pluralAbbrev: 'figs.' },
  { singularWord: 'section', pluralWord: 'sections', singularAbbrev: 'sec.', pluralAbbrev: 'secs.' },
  { singularWord: 'article', pluralWord: 'articles', singularAbbrev: 'art.', pluralAbbrev: 'arts.' },
  { singularWord: 'folio', pluralWord: 'folios', singularAbbrev: 'fol.', pluralAbbrev: 'fols.' },
]

const REF_ABBREVS = TERMS.map(t => t.singularAbbrev.replace(/\.$/, '')).concat(TERMS.map(t => t.pluralAbbrev.replace(/\.$/, '')))
const REF_WORDS = TERMS.map(t => t.singularWord).concat(TERMS.map(t => t.pluralWord))

// Match terms as distinct words, potentially followed by a dot
const REF_TERM_PATTERN = new RegExp(
  `\\b(${REF_ABBREVS.join('|')})\\b\\.?|\\b(${REF_WORDS.join('|')})\\b`,
  'gi'
)

function isIndexItalic(para: DocxParagraph | undefined, index: number): boolean {
  if (!para) return false
  let charCount = 0
  for (const run of para.runs) {
    const runStart = charCount
    const runEnd = charCount + run.text.length
    if (index >= runStart && index < runEnd) {
      return !!run.properties?.italic
    }
    charCount = runEnd
  }
  return false
}

function isInsideQuotes(text: string, index: number): boolean {
  const preceding = text.substring(0, index)
  
  const lastCurlyOpen = preceding.lastIndexOf('“')
  const lastCurlyClose = preceding.lastIndexOf('”')
  const lastSingleOpen = preceding.lastIndexOf('‘')
  const lastSingleClose = preceding.lastIndexOf('’')
  
  if (lastCurlyOpen > lastCurlyClose) {
    return true
  }
  if (lastSingleOpen > lastSingleClose) {
    return true
  }
  
  const straightDoubleCount = (preceding.match(/"/g) || []).length
  if (straightDoubleCount % 2 === 1) {
    return true
  }
  
  const straightSingleCount = (preceding.match(/'/g) || []).length
  if (straightSingleCount % 2 === 1) {
    return true
  }
  
  return false
}

export const sblReferenceAbbreviationsRule: StyleRule = {
  id: 'sbl-reference-abbreviations',
  name: 'SBL Reference Abbreviations',
  description: 'Enforces correct SBL v2 abbreviations (singular/plural and abbreviation context) for reference terms like verse, chapter, page, etc.',
  scope: ['body', 'footnote'],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = []
    const doc = context.document
    const sections = context.sections

    const processText = (
      text: string,
      pIndex: number | undefined,
      region: DocumentRegion | undefined,
      footnoteId?: string,
      para?: DocxParagraph
    ) => {
      // Find all reference terms
      REF_TERM_PATTERN.lastIndex = 0
      let match

      while ((match = REF_TERM_PATTERN.exec(text)) !== null) {
        const matchIndex = match.index
        const matchedTermWithDot = match[0]

        // Skip if within italicized text (book title) or within quotation marks (article title)
        if (isIndexItalic(para, matchIndex) || isInsideQuotes(text, matchIndex)) {
          continue
        }

        // Check what follows the term
        const afterText = text.substring(matchIndex + matchedTermWithDot.length)

        // Match numbers, ranges, lists of numbers following the term
        const numberListMatch = afterText.match(/^\s+(\d+(?:\s*[-–,]\s*\d+|\s+(?:and|&)\s*\d+)*)/i)
        if (!numberListMatch) {
          continue // Not followed by a number, skip (especially for unabbreviated prose)
        }

        const numberList = numberListMatch[1]
        const spacing = afterText.substring(0, afterText.indexOf(numberList))
        const matchedText = matchedTermWithDot + spacing + numberList

        // Parse numbers to determine if it is plural
        const numbersCount = (numberList.match(/\d+/g) || []).length
        const isRange = numberList.includes('-') || numberList.includes('–')
        const isPlural = numbersCount > 1 || isRange

        // Find the canonical term config
        const matchTermLower = matchedTermWithDot.toLowerCase().replace(/\.$/, '')
        const refTerm = TERMS.find(
          t =>
            t.singularWord === matchTermLower ||
            t.pluralWord === matchTermLower ||
            t.singularAbbrev.replace(/\.$/, '') === matchTermLower ||
            t.pluralAbbrev.replace(/\.$/, '') === matchTermLower
        )

        if (!refTerm) {
          continue // Should not happen given regex
        }

        const expectedNumber = isPlural ? 'plural' : 'singular'
        const isSentenceStartOutside = (!isInsideParentheses(text, matchIndex) && footnoteId === undefined) && isSentenceStart(text, matchIndex)

        let expectedTerm: string
        if (isSentenceStartOutside) {
          expectedTerm = expectedNumber === 'plural' ? refTerm.pluralWord : refTerm.singularWord
          expectedTerm = expectedTerm.charAt(0).toUpperCase() + expectedTerm.slice(1)
        } else {
          expectedTerm = expectedNumber === 'plural' ? refTerm.pluralAbbrev : refTerm.singularAbbrev
          expectedTerm = expectedTerm.toLowerCase()
        }

        const expectedText = expectedTerm + spacing + numberList

        if (matchedText !== expectedText) {
          const isMatchedPlural =
            matchTermLower === refTerm.pluralWord ||
            matchTermLower === refTerm.pluralAbbrev.replace(/\.$/, '')

          const isMatchedSingular =
            matchTermLower === refTerm.singularWord ||
            matchTermLower === refTerm.singularAbbrev.replace(/\.$/, '')

          // Identify issue type for the message
          let message = 'Incorrect reference abbreviation format'
          if (isPlural && isMatchedSingular) {
            message = 'Singular reference form used with a range or list of values'
          } else if (!isPlural && isMatchedPlural) {
            message = 'Plural reference form used with a single value'
          } else if (isSentenceStartOutside && matchedTermWithDot.endsWith('.')) {
            message = 'Abbreviated reference form used at the start of a sentence'
          } else if (!isSentenceStartOutside && !matchedTermWithDot.endsWith('.')) {
            message = 'Unabbreviated reference form used mid-sentence'
          }


          violations.push({
            ruleId: sblReferenceAbbreviationsRule.id,
            ruleName: sblReferenceAbbreviationsRule.name,
            severity: 'warning',
            message,
            paragraphIndex: pIndex,
            region,
            detail: footnoteId ? `Footnote ID: ${footnoteId}` : undefined,
            correction: {
              found: matchedText,
              expected: expectedText,
            },
            paragraphSnippet: getParagraphSnippet(text),
          })
        }
      }
    }

    // Process body paragraphs
    doc.paragraphs.forEach((para, index) => {
      const region = getRegionForParagraph(para, sections)
      if (region === 'title-page' || region === 'bibliography') return
      const text = getParagraphText(para)
      processText(text, index, region, undefined, para)
    })

    // Process footnotes
    for (const footnote of doc.footnotes) {
      for (const para of footnote.paragraphs) {
        const text = getParagraphText(para)
        processText(text, undefined, undefined, String(footnote.id), para)
      }
    }

    return violations
  },
}
