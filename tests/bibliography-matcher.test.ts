import { describe, it, expect } from 'vitest'
import { parseBibliography } from '../src/analysis/bibliography-parser'
import { matchReferencesToBibliography } from '../src/analysis/bibliography-matcher'
import { detectAndExtractReferences } from '../src/rules/sbl-reference-detector'
import { createTestParagraph } from './test-utils'

describe('Bibliography Matcher', () => {
  it('should match book first reference to bibliography entry', () => {
    const bibParas = [
      createTestParagraph('Talbert, Charles H. Reading John: A Literary and Theological Commentary. New York: Crossroad, 1992.')
    ]
    const bibEntries = parseBibliography(bibParas)

    const footnoteText = 'Charles H. Talbert, Reading John: A Literary and Theological Commentary (New York: Crossroad, 1992), 127.'
    const refs = detectAndExtractReferences(footnoteText)

    const matches = matchReferencesToBibliography(refs, bibEntries)
    expect(matches.length).toBe(1)
    expect(matches[0].confidence).toBe('exact')
    expect(matches[0].bibEntry).not.toBeNull()
    expect(matches[0].bibEntry?.authors).toBe('Talbert, Charles H')
  })

  it('should match short reference to bibliography entry using case-insensitive substring', () => {
    const bibParas = [
      createTestParagraph('Talbert, Charles H. Reading John: A Literary and Theological Commentary. New York: Crossroad, 1992.')
    ]
    const bibEntries = parseBibliography(bibParas)

    const footnoteText = 'Talbert, Reading John, 145.'
    const refs = detectAndExtractReferences(footnoteText)

    const matches = matchReferencesToBibliography(refs, bibEntries)
    expect(matches.length).toBe(1)
    expect(matches[0].confidence).toBe('exact')
    expect(matches[0].bibEntry).not.toBeNull()
  })

  it('should return partial confidence if author matches but title mismatches', () => {
    const bibParas = [
      createTestParagraph('Talbert, Charles H. Reading John: A Literary and Theological Commentary. New York: Crossroad, 1992.')
    ]
    const bibEntries = parseBibliography(bibParas)

    const footnoteText = 'Talbert, Reading Mark, 145.'
    const refs = detectAndExtractReferences(footnoteText)

    const matches = matchReferencesToBibliography(refs, bibEntries)
    expect(matches.length).toBe(1)
    expect(matches[0].confidence).toBe('partial')
  })

  it('should return none confidence if no matching entry is found', () => {
    const bibParas = [
      createTestParagraph('Talbert, Charles H. Reading John: A Literary and Theological Commentary. New York: Crossroad, 1992.')
    ]
    const bibEntries = parseBibliography(bibParas)

    const footnoteText = 'Leyerle, "John Chrysostom," 162.'
    const refs = detectAndExtractReferences(footnoteText)

    const matches = matchReferencesToBibliography(refs, bibEntries)
    expect(matches.length).toBe(1)
    expect(matches[0].confidence).toBe('none')
  })
})
