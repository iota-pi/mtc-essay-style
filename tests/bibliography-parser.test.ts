import { describe, it, expect } from 'vitest'
import { parseBibliography } from '../src/analysis/bibliography-parser'
import { createTestParagraph } from './test-utils'

describe('Bibliography Entry Parser', () => {
  it('should parse standard book entry', () => {
    const paras = [
      createTestParagraph('Bibliography'),
      createTestParagraph('Talbert, Charles H. Reading John: A Literary and Theological Commentary. New York: Crossroad, 1992.')
    ]
    const entries = parseBibliography(paras)
    expect(entries.length).toBe(1)
    expect(entries[0].type).toBe('book')
    expect(entries[0].authors).toBe('Talbert, Charles H')
    expect(entries[0].title).toBe('Reading John: A Literary and Theological Commentary')
    expect(entries[0].location).toBe('New York')
    expect(entries[0].publisher).toBe('Crossroad')
    expect(entries[0].year).toBe('1992')
  })

  it('should parse journal article entry', () => {
    const paras = [
      createTestParagraph('Leyerle, Blake. "John Chrysostom on the Gaze." JECS 1 (1993): 159–74.')
    ]
    const entries = parseBibliography(paras)
    expect(entries.length).toBe(1)
    expect(entries[0].type).toBe('journal-article')
    expect(entries[0].authors).toBe('Leyerle, Blake')
    expect(entries[0].title).toBe('John Chrysostom on the Gaze')
    expect(entries[0].containerTitle).toBe('JECS')
    expect(entries[0].volume).toBe('1')
    expect(entries[0].year).toBe('1993')
    expect(entries[0].pages).toBe('159–74')
  })

  it('should parse chapter entry', () => {
    const paras = [
      createTestParagraph('Attridge, Harold W. "Jewish Historiography." Pages 311–43 in Early Judaism and Its Modern Interpreters. Edited by Robert A. Kraft. Philadelphia: Fortress, 1986.')
    ]
    const entries = parseBibliography(paras)
    expect(entries.length).toBe(1)
    expect(entries[0].type).toBe('chapter')
    expect(entries[0].authors).toBe('Attridge, Harold W')
    expect(entries[0].title).toBe('Jewish Historiography')
    expect(entries[0].pages).toBe('311–43')
    expect(entries[0].containerTitle).toBe('Early Judaism and Its Modern Interpreters')
    expect(entries[0].editor).toBe('Robert A. Kraft')
    expect(entries[0].location).toBe('Philadelphia')
    expect(entries[0].publisher).toBe('Fortress')
    expect(entries[0].year).toBe('1986')
  })
})
