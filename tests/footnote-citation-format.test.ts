import { describe, it, expect } from 'vitest'
import { footnoteCitationFormatRule } from '../src/rules/definitions/footnote-citation-format'
import { createTestContext, createTestDocument, createTestParagraph } from './test-utils'

describe('Footnote Citation Format Rule', () => {
  it('should not report violation for correctly formatted SBL citations', () => {
    const doc = createTestDocument({
      footnotes: [
        {
          id: 1,
          paragraphs: [createTestParagraph('Talbert, Reading John, 145.')]
        }
      ]
    })
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
    const violations = footnoteCitationFormatRule.check(context)
    expect(violations.length).toBe(0)
  })

  it('should not report violation for plain prose', () => {
    const doc = createTestDocument({
      footnotes: [
        {
          id: 1,
          paragraphs: [createTestParagraph('This is just a regular discussion about the text.')]
        }
      ]
    })
    const sections = {
      titlePage: [],
      body: [],
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    }
    const context = createTestContext(doc, sections)
    const violations = footnoteCitationFormatRule.check(context)
    expect(violations.length).toBe(0)
  })

  it('should report violation for malformed citation starting with bibliography author surname', () => {
    const doc = createTestDocument({
      footnotes: [
        {
          id: 1,
          paragraphs: [createTestParagraph('Talbert Reading John 145.')]
        }
      ]
    })
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
    const violations = footnoteCitationFormatRule.check(context)
    expect(violations.length).toBe(1)
    expect(violations[0].ruleId).toBe('sbl-footnote-citation-format')
    expect(violations[0].severity).toBe('warning')
  })

  it('should report violation for malformed Ibid reference', () => {
    const doc = createTestDocument({
      footnotes: [
        {
          id: 1,
          paragraphs: [createTestParagraph('Ibid 145.')]
        }
      ]
    })
    const sections = {
      titlePage: [],
      body: [],
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    }
    const context = createTestContext(doc, sections)
    const violations = footnoteCitationFormatRule.check(context)
    expect(violations.length).toBe(1)
    expect(violations[0].ruleId).toBe('sbl-footnote-citation-format')
  })
})
