import { describe, it, expect } from 'vitest'
import { bibliographyRequiredRule } from '../src/rules/definitions/bibliography-required'
import { createTestContext, createTestDocument, createTestParagraph } from './test-utils'

describe('Bibliography Required Rule', () => {
  it('should not report violation if bibliography is present', () => {
    const doc = createTestDocument()
    const sections = {
      titlePage: [],
      body: [createTestParagraph('Body text.')],
      bibliography: [createTestParagraph('Bibliography'), createTestParagraph('Entry 1.')],
      hasTitlePage: false,
      hasBibliography: true
    }
    const context = createTestContext(doc, sections)
    const violations = bibliographyRequiredRule.check(context)
    expect(violations.length).toBe(0)
  })

  it('should report error violation if bibliography is missing', () => {
    const doc = createTestDocument()
    const sections = {
      titlePage: [],
      body: [createTestParagraph('Body text.')],
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    }
    const context = createTestContext(doc, sections)
    const violations = bibliographyRequiredRule.check(context)
    expect(violations.length).toBe(1)
    expect(violations[0].ruleId).toBe('sbl-bibliography-required')
    expect(violations[0].severity).toBe('error')
  })
})
