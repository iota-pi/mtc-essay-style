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
        createTestParagraph('Talbert, Charles H. Reading John: A Literary and Theological Commentary. 1992.')
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

  it('should report violation for journal article missing year', () => {
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
})
