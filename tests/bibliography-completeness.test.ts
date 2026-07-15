import { describe, it, expect } from 'vitest'
import { bibliographyCompletenessRule } from '../src/rules/definitions/bibliography-completeness'
import { createTestContext, createTestDocument, createTestParagraph } from './test-utils'

describe('Bibliography Completeness Rule', () => {
  it('should not report violation for a complete book entry', () => {
    const doc = createTestDocument()
    const sections = {
      titlePage: [],
      body: [],
      bibliography: [
        createTestParagraph('Bibliography'),
        createTestParagraph('Talbert, Charles H. Reading John: A Literary and Theological Commentary. New York: Crossroad, 1992.')
      ],
      hasTitlePage: false,
      hasBibliography: true
    }
    const context = createTestContext(doc, sections)
    const violations = bibliographyCompletenessRule.check(context)
    expect(violations.length).toBe(0)
  })

  it('should report violation for book entry missing publisher and location', () => {
    const doc = createTestDocument()
    const sections = {
      titlePage: [],
      body: [],
      bibliography: [
        createTestParagraph('Bibliography'),
        createTestParagraph('Talbert, Charles H. Reading John: A Literary and Theological Commentary. 1892.')
      ],
      hasTitlePage: false,
      hasBibliography: true
    }
    const context = createTestContext(doc, sections)
    const violations = bibliographyCompletenessRule.check(context)
    expect(violations.length).toBe(1)
    expect(violations[0].ruleId).toBe('sbl-bibliography-completeness')
    expect(violations[0].message).toContain('Missing publisher')
    expect(violations[0].message).toContain('Missing place of publication')
  })

  it('should report violation for a journal article missing year', () => {
    const doc = createTestDocument()
    const sections = {
      titlePage: [],
      body: [],
      bibliography: [
        createTestParagraph('Bibliography'),
        createTestParagraph('Leyerle, Blake. "John Chrysostom on the Gaze." JECS 1: 159–74.')
      ],
      hasTitlePage: false,
      hasBibliography: true
    }
    const context = createTestContext(doc, sections)
    const violations = bibliographyCompletenessRule.check(context)
    expect(violations.length).toBe(1)
    expect(violations[0].ruleId).toBe('sbl-bibliography-completeness')
    expect(violations[0].message).toContain('Missing publication date/year')
  })

  it('should not report violation for a book entry published after 1900 without location', () => {
    const doc = createTestDocument()
    const sections = {
      titlePage: [],
      body: [],
      bibliography: [
        createTestParagraph('Bibliography'),
        createTestParagraph('Talbert, Charles H. Reading John: A Literary and Theological Commentary. Crossroad, 1992.')
      ],
      hasTitlePage: false,
      hasBibliography: true
    }
    const context = createTestContext(doc, sections)
    const violations = bibliographyCompletenessRule.check(context)
    expect(violations.length).toBe(0)
  })

  it('should report violation for a book entry published in/before 1900 without location', () => {
    const doc = createTestDocument()
    const sections = {
      titlePage: [],
      body: [],
      bibliography: [
        createTestParagraph('Bibliography'),
        createTestParagraph('Augustine, Aurelius. Confessions. Catholic University of America Press, 1900.')
      ],
      hasTitlePage: false,
      hasBibliography: true
    }
    const context = createTestContext(doc, sections)
    const violations = bibliographyCompletenessRule.check(context)
    expect(violations.length).toBe(1)
    expect(violations[0].message).toContain('Missing place of publication (location)')
  })

  it('should not report violation for a chapter entry published after 1900 without location', () => {
    const doc = createTestDocument()
    const sections = {
      titlePage: [],
      body: [],
      bibliography: [
        createTestParagraph('Bibliography'),
        createTestParagraph('Attridge, Harold W. "Jewish Historiography." Pages 311–43 in Early Judaism and Its Modern Interpreters. Edited by Robert A. Kraft. Fortress, 1986.')
      ],
      hasTitlePage: false,
      hasBibliography: true
    }
    const context = createTestContext(doc, sections)
    const violations = bibliographyCompletenessRule.check(context)
    expect(violations.length).toBe(0)
  })

  it('should report violation for a chapter entry published in/before 1900 without location', () => {
    const doc = createTestDocument()
    const sections = {
      titlePage: [],
      body: [],
      bibliography: [
        createTestParagraph('Bibliography'),
        createTestParagraph('Wellhausen, Julius. "Prolegomena to the History of Israel." Pages 1–10 in Prolegomena. Reimer, 1883.')
      ],
      hasTitlePage: false,
      hasBibliography: true
    }
    const context = createTestContext(doc, sections)
    const violations = bibliographyCompletenessRule.check(context)
    expect(violations.length).toBe(1)
    expect(violations[0].message).toContain('Missing place of publication (location)')
  })

  it('should not report violation for nested quotes at start of title (e.g. Jeffers case)', () => {
    const doc = createTestDocument()
    const sections = {
      titlePage: [],
      body: [],
      bibliography: [
        createTestParagraph('Bibliography'),
        createTestParagraph('Jeffers, Neil G. T. “‘And Their Children After Them’: A Response to Reformed Baptist Readings of Jeremiah’s New Covenant Promises.” Ecclesia Reformanda 1.2 (2009).')
      ],
      hasTitlePage: false,
      hasBibliography: true
    }
    const context = createTestContext(doc, sections)
    const violations = bibliographyCompletenessRule.check(context)
    expect(violations.length).toBe(0)
  })

  it('should not report violation for book with period in publisher and no city (e.g. O’Brien case)', () => {
    const doc = createTestDocument()
    const sections = {
      titlePage: [],
      body: [],
      bibliography: [
        createTestParagraph('Bibliography'),
        createTestParagraph('O’Brien, Peter T. Hebrews. Pillar New Testament Commentary. W.B. Eerdmans Pub. Co., 2010.')
      ],
      hasTitlePage: false,
      hasBibliography: true
    }
    const context = createTestContext(doc, sections)
    const violations = bibliographyCompletenessRule.check(context)
    expect(violations.length).toBe(0)
  })
})
