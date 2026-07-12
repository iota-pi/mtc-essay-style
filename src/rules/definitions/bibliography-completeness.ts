import { StyleRule, StyleViolation } from '../types'
import { parseBibliography } from '../../analysis/bibliography-parser'
import { getParagraphSnippet } from '../utils'

export const bibliographyCompletenessRule: StyleRule = {
  id: 'sbl-bibliography-completeness',
  name: 'SBL Bibliography Completeness',
  description: 'Verifies that bibliography entries contain critical citation information like publication date, publisher, publication location, or container titles.',
  scope: ['bibliography'],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = []
    const sections = context.sections

    if (!sections.hasBibliography) {
      return violations
    }

    const entries = parseBibliography(sections.bibliography)

    for (const entry of entries) {
      if (entry.type === 'unknown') {
        continue
      }

      const issues: string[] = []

      if (!entry.year) {
        issues.push('Missing publication date/year')
      }

      if (entry.type === 'book' || entry.type === 'chapter') {
        if (!entry.publisher) {
          issues.push('Missing publisher')
        }
        if (!entry.location) {
          issues.push('Missing place of publication (location)')
        }
      }

      if (entry.type === 'journal-article') {
        if (!entry.containerTitle) {
          issues.push('Missing journal name')
        }
      }

      if (entry.type === 'chapter') {
        if (!entry.containerTitle) {
          issues.push('Missing book title (container work)')
        }
      }

      if (issues.length > 0) {
        violations.push({
          ruleId: this.id,
          ruleName: this.name,
          severity: 'warning',
          message: `Bibliography entry is missing critical citation info: ${issues.join(', ')}.`,
          region: 'bibliography',
          detail: `Entry text: "${entry.rawText}"`,
          paragraphSnippet: getParagraphSnippet(entry.rawText)
        })
      }
    }

    return violations
  }
}

export default bibliographyCompletenessRule
