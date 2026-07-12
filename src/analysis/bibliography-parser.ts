import type { DocxParagraph } from '../docx/types'
import { getParagraphText } from '../rules/utils'

export interface BibliographyEntry {
  rawText: string;
  paragraphIndex: number;
  type: 'book' | 'journal-article' | 'chapter' | 'unknown';
  authors?: string;
  title?: string;
  containerTitle?: string;
  editor?: string;
  publisher?: string;
  location?: string;
  year?: string;
  pages?: string;
  volume?: string;
}

const BIBLIOGRAPHY_HEADINGS = new Set([
  'bibliography',
  'references',
  'works cited',
  'reference list',
  'bibliography of sources cited'
])

const AUTHOR_FIELD_REGEX = /^[A-Z][A-Za-z\s\-’,]+?,\s+[A-Z][A-Za-z\s\-’.,&()]+?\./

export function parseBibliography(paragraphs: DocxParagraph[]): BibliographyEntry[] {
  const entries: BibliographyEntry[] = []
  if (paragraphs.length === 0) return entries

  let startIndex = 0
  const firstParaText = getParagraphText(paragraphs[0]).toLowerCase().replace(/[:.]/g, '').trim()
  if (BIBLIOGRAPHY_HEADINGS.has(firstParaText)) {
    startIndex = 1
  }

  for (let i = startIndex; i < paragraphs.length; i++) {
    const rawText = getParagraphText(paragraphs[i]).trim()
    if (!rawText) continue

    const entry: BibliographyEntry = {
      rawText,
      paragraphIndex: i,
      type: 'unknown'
    }

    const authorMatch = rawText.match(AUTHOR_FIELD_REGEX)
    if (!authorMatch) {
      entries.push(entry)
      continue
    }

    const authors = authorMatch[0].trim().replace(/\.$/, '')
    entry.authors = authors

    const restOfText = rawText.substring(authorMatch[0].length).trim()

    const quotedTitleMatch = restOfText.match(/^[“"‘]([^“”"‘’]+?)[”"’]\.?\s*(.*)$/)
    if (quotedTitleMatch) {
      const title = quotedTitleMatch[1].trim().replace(/[.,]$/, '').trim()
      const rest = quotedTitleMatch[2].trim()

      const isChapter = /\b(in|pages|pp\.)\b/i.test(rest)
      if (isChapter) {
        entry.type = 'chapter'
        entry.title = title

        const pagesMatch = rest.match(/pages?\s*(\d+[\d\s–-]*)\s+in\s+([^.]+)/i)
        if (pagesMatch) {
          entry.pages = pagesMatch[1].trim()
          entry.containerTitle = pagesMatch[2].trim().replace(/\.$/, '')
        } else {
          const inMatch = rest.match(/in\s+([^.]+)/i)
          if (inMatch) {
            entry.containerTitle = inMatch[1].trim().replace(/\.$/, '')
          }
        }

        const editorMatch = rest.match(/(?:edited\s+by|eds?\.?\s*|ed\.?\s*)\s*([^:]+?)\.(?:\s+[A-Z][A-Za-z\s\-]+?:|\s*$)/i)
        if (editorMatch) {
          entry.editor = editorMatch[1].trim()
        }

        const pubMatch = rest.match(/([^.]+?):\s*([^,]+?),\s*(\d{4})\.?$/)
        if (pubMatch) {
          entry.location = pubMatch[1].trim()
          entry.publisher = pubMatch[2].trim()
          entry.year = pubMatch[3]
        } else {
          const simplePubMatch = rest.match(/([^,.]+?),\s*(\d{4})\.?$/)
          if (simplePubMatch) {
            entry.publisher = simplePubMatch[1].trim()
            entry.year = simplePubMatch[2]
          }
        }

        if (!entry.year) {
          const yrMatch = rest.match(/\b\d{4}\b/)
          if (yrMatch) {
            entry.year = yrMatch[0]
          }
        }
      } else {
        entry.type = 'journal-article'
        entry.title = title

        const journalPattern = /^([^0-9(]+?)\s+(\d+(?:\.\d+)?)\s*\((\d{4})\)(?::\s*(.+))?$/
        const journalMatch = rest.match(journalPattern)
        if (journalMatch) {
          entry.containerTitle = journalMatch[1].trim()
          entry.volume = journalMatch[2].trim()
          entry.year = journalMatch[3].trim()
          if (journalMatch[4]) {
            entry.pages = journalMatch[4].trim().replace(/\.$/, '')
          }
        } else {
          const yrMatch = rest.match(/\b\d{4}\b/)
          if (yrMatch) entry.year = yrMatch[0]

          const nameMatch = rest.match(/^([^0-9(]+)/)
          if (nameMatch) {
            entry.containerTitle = nameMatch[1].trim()
          }
        }
      }
    } else {
      entry.type = 'book'

      const bookMatch = restOfText.match(/^(.+?)\.\s+([^.]+?):\s*([^,]+?),\s*(\d{4})\.?$/)
      if (bookMatch) {
        entry.title = bookMatch[1].trim()
        entry.location = bookMatch[2].trim()
        entry.publisher = bookMatch[3].trim()
        entry.year = bookMatch[4]
      } else {
        const bookMatch2 = restOfText.match(/^(.+?)\.\s+([^,.]+?),\s*(\d{4})\.?$/)
        if (bookMatch2) {
          entry.title = bookMatch2[1].trim()
          entry.publisher = bookMatch2[2].trim()
          entry.year = bookMatch2[3]
        } else {
          const fields = restOfText.split('.')
          if (fields.length > 0) {
            entry.title = fields[0].trim()
          }
          const yrMatch = restOfText.match(/\b\d{4}\b/)
          if (yrMatch) entry.year = yrMatch[0]
        }
      }
    }

    entries.push(entry)
  }

  return entries
}
