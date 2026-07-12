import type { SblReferenceFields } from '../rules/sbl-reference-detector'
import type { BibliographyEntry } from './bibliography-parser'

export interface BibliographyMatch {
  footnoteRef: SblReferenceFields;
  bibEntry: BibliographyEntry | null;
  confidence: 'exact' | 'partial' | 'none';
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

function cleanTitle(title: string | undefined): string {
  if (!title) return ''
  return title
    .toLowerCase()
    .replace(/[“”"‘’'.:,;\-\u2013\u2014]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchReferencesToBibliography(
  refs: SblReferenceFields[],
  bibEntries: BibliographyEntry[]
): BibliographyMatch[] {
  const matches: BibliographyMatch[] = []

  for (const ref of refs) {
    if (ref.span.type === 'ibid-reference') {
      matches.push({
        footnoteRef: ref,
        bibEntry: null,
        confidence: 'none'
      })
      continue
    }

    if (!ref.author) {
      matches.push({
        footnoteRef: ref,
        bibEntry: null,
        confidence: 'none'
      })
      continue
    }

    let bestMatch: BibliographyEntry | null = null
    let bestConfidence: 'exact' | 'partial' | 'none' = 'none'

    const refAuthorLower = ref.author.toLowerCase()
    const cleanFnTitle = cleanTitle(ref.title)

    for (const entry of bibEntries) {
      const bibAuthor = extractSurnameFromBibAuthors(entry.authors)
      if (bibAuthor.toLowerCase() === refAuthorLower) {
        let confidence: 'exact' | 'partial' | 'none' = 'partial'

        const cleanBibTitle = cleanTitle(entry.title)
        if (cleanFnTitle && cleanBibTitle.includes(cleanFnTitle)) {
          confidence = 'exact'
        }

        if (confidence === 'exact') {
          bestMatch = entry
          bestConfidence = 'exact'
          break
        } else if (confidence === 'partial' && (bestConfidence as string) !== 'exact') {
          bestMatch = entry
          bestConfidence = 'partial'
        }
      }
    }

    matches.push({
      footnoteRef: ref,
      bibEntry: bestMatch,
      confidence: bestConfidence
    })
  }

  return matches
}
