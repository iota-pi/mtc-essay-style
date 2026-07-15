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
const SAME_AUTHOR_REGEX = /^(?:—{2,3}|_{3,}|-{3,})\./

function parsePublicationInfo(text: string): { location?: string; publisher?: string; year?: string; cleanTextBefore: string } {
  const yearMatch = text.match(/,\s*(\d{4})\.?$/)
  if (!yearMatch) {
    return { cleanTextBefore: text }
  }

  const year = yearMatch[1]
  const textBeforeYear = text.substring(0, text.length - yearMatch[0].length).trim()

  const lastColonIndex = textBeforeYear.lastIndexOf(':')
  if (lastColonIndex !== -1) {
    const potentialLocationPart = textBeforeYear.substring(0, lastColonIndex).trim()
    const publisherPart = textBeforeYear.substring(lastColonIndex + 1).trim()

    const lastPeriodIndex = potentialLocationPart.lastIndexOf('. ')
    if (lastPeriodIndex !== -1) {
      const titlePart = potentialLocationPart.substring(0, lastPeriodIndex).trim()
      const locationPart = potentialLocationPart.substring(lastPeriodIndex + 2).trim()
      return {
        location: locationPart,
        publisher: publisherPart,
        year,
        cleanTextBefore: titlePart
      }
    } else {
      return {
        location: potentialLocationPart,
        publisher: publisherPart,
        year,
        cleanTextBefore: ''
      }
    }
  }

  const segments = textBeforeYear.split(/\.\s+/)
  if (segments.length === 1) {
    return {
      publisher: segments[0].trim(),
      year,
      cleanTextBefore: ''
    }
  }

  const publisherKeywords = new Set([
    'co', 'co.', 'inc', 'inc.', 'ltd', 'ltd.', 'press', 'pub', 'pub.', 'publishing', 'publisher', 'publishers', 'books', 'publications', 'academic'
  ])

  let publisherSegmentsCount = 1
  for (let i = segments.length - 1; i > 0; i--) {
    const currentSegment = segments[i].trim().toLowerCase()
    const prevSegment = segments[i - 1].trim().toLowerCase()

    const isCurrentKeyword = publisherKeywords.has(currentSegment) || publisherKeywords.has(currentSegment.replace(/\.$/, ''))
    const isPrevEndingInKeyword = Array.from(publisherKeywords).some(kw => prevSegment.endsWith(kw))
    const isPrevInitials = /^[a-z](?:\.[a-z])*$/.test(prevSegment)

    if (isCurrentKeyword || isPrevEndingInKeyword || isPrevInitials) {
      publisherSegmentsCount++
    } else {
      break
    }
  }

  const titleSegments = segments.slice(0, segments.length - publisherSegmentsCount)
  const publisherSegments = segments.slice(segments.length - publisherSegmentsCount)

  return {
    publisher: publisherSegments.join('. ').trim(),
    year,
    cleanTextBefore: titleSegments.join('. ').trim()
  }
}

export function parseBibliography(paragraphs: DocxParagraph[]): BibliographyEntry[] {
  const entries: BibliographyEntry[] = []
  if (paragraphs.length === 0) return entries

  let startIndex = 0
  const firstParaText = getParagraphText(paragraphs[0]).toLowerCase().replace(/[:.]/g, '').trim()
  if (BIBLIOGRAPHY_HEADINGS.has(firstParaText)) {
    startIndex = 1
  }

  let lastAuthor = ''

  for (let i = startIndex; i < paragraphs.length; i++) {
    const rawText = getParagraphText(paragraphs[i]).trim()
    if (!rawText) continue

    const entry: BibliographyEntry = {
      rawText,
      paragraphIndex: i,
      type: 'unknown'
    }

    let authors = ''
    let restOfText = ''

    const sameAuthorMatch = rawText.match(SAME_AUTHOR_REGEX)
    const authorMatch = rawText.match(AUTHOR_FIELD_REGEX)

    if (sameAuthorMatch) {
      authors = lastAuthor || sameAuthorMatch[0].trim().replace(/\.$/, '')
      entry.authors = authors
      restOfText = rawText.substring(sameAuthorMatch[0].length).trim()
    } else if (authorMatch) {
      let authorPart = authorMatch[0]
      let rest = rawText.substring(authorMatch[0].length)

      while (true) {
        const initialMatch = rest.match(/^\s+([A-Z]\.)/)
        if (initialMatch) {
          authorPart += initialMatch[0]
          rest = rest.substring(initialMatch[0].length)
        } else {
          break
        }
      }

      authors = authorPart.trim().replace(/\.$/, '')
      entry.authors = authors
      lastAuthor = authors
      restOfText = rest.trim()
    } else {
      entries.push(entry)
      continue
    }

    // Try to match double quotes first, which may contain single quotes/apostrophes inside
    let quotedTitleMatch = restOfText.match(/^[“"](.*?)[”"]\.?\s*(.*)$/)
    if (!quotedTitleMatch) {
      // Fallback for single quotes, avoiding apostrophes
      quotedTitleMatch = restOfText.match(/^[‘'](.*?)[’'](?![a-zA-Z])\.?\s*(.*)$/)
    }

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

        const pubInfo = parsePublicationInfo(rest)
        if (pubInfo.publisher) entry.publisher = pubInfo.publisher
        if (pubInfo.location) entry.location = pubInfo.location
        if (pubInfo.year) entry.year = pubInfo.year

        if (!entry.year) {
          const yrMatch = rest.match(/\b\d{4}\b/)
          if (yrMatch) {
            entry.year = yrMatch[0]
          }
        }
      } else {
        entry.type = 'journal-article'
        entry.title = title

        const journalPattern = /^([^0-9(]+?)\s+(\d+(?:\.\d+)?)\s*\((\d{4})\)(?::\s*(.+?))?\.?$/
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

      const pubInfo = parsePublicationInfo(restOfText)
      if (pubInfo.year) {
        entry.year = pubInfo.year
        entry.publisher = pubInfo.publisher
        entry.location = pubInfo.location
        entry.title = pubInfo.cleanTextBefore
      } else {
        const fields = restOfText.split('.')
        if (fields.length > 0) {
          entry.title = fields[0].trim()
        }
        const yrMatch = restOfText.match(/\b\d{4}\b/)
        if (yrMatch) entry.year = yrMatch[0]
      }
    }

    entries.push(entry)
  }

  return entries
}
