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

  it('should parse nested quotes at start of title (e.g. journal article)', () => {
    const paras = [
      createTestParagraph('Jeffers, Neil G. T. “‘And Their Children After Them’: A Response to Reformed Baptist Readings of Jeremiah’s New Covenant Promises.” Ecclesia Reformanda 1.2 (2009).')
    ]
    const entries = parseBibliography(paras)
    expect(entries.length).toBe(1)
    expect(entries[0].type).toBe('journal-article')
    expect(entries[0].authors).toBe('Jeffers, Neil G. T')
    expect(entries[0].title).toBe('‘And Their Children After Them’: A Response to Reformed Baptist Readings of Jeremiah’s New Covenant Promises')
    expect(entries[0].containerTitle).toBe('Ecclesia Reformanda')
    expect(entries[0].volume).toBe('1.2')
    expect(entries[0].year).toBe('2009')
  })

  it('should parse book entry with period in publisher and no city', () => {
    const paras = [
      createTestParagraph('O’Brien, Peter T. Hebrews. Pillar New Testament Commentary. W.B. Eerdmans Pub. Co., 2010.')
    ]
    const entries = parseBibliography(paras)
    expect(entries.length).toBe(1)
    expect(entries[0].type).toBe('book')
    expect(entries[0].authors).toBe('O’Brien, Peter T')
    expect(entries[0].title).toBe('Hebrews. Pillar New Testament Commentary')
    expect(entries[0].publisher).toBe('W.B. Eerdmans Pub. Co.')
    expect(entries[0].year).toBe('2010')
  })

  it('should parse same-author dashes and resolve author name from previous entry', () => {
    const paras = [
      createTestParagraph('Gatiss, Lee. “The Anglican Doctrine of Infant Baptism.” The Global Anglican 134.4 (2020).'),
      createTestParagraph('———. The Letter to the Ephesians. Pillar New Testament Commentary. W.B. Eerdmans Pub. Co., 1999.')
    ]
    const entries = parseBibliography(paras)
    expect(entries.length).toBe(2)
    
    expect(entries[0].type).toBe('journal-article')
    expect(entries[0].authors).toBe('Gatiss, Lee')
    
    expect(entries[1].type).toBe('book')
    expect(entries[1].authors).toBe('Gatiss, Lee') // inherited
    expect(entries[1].publisher).toBe('W.B. Eerdmans Pub. Co.')
    expect(entries[1].year).toBe('1999')
  })
})
