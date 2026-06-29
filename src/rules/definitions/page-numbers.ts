import { StyleRule, StyleViolation } from '../types'

export const pageNumbersRule: StyleRule = {
  id: 'format-page-numbers',
  name: 'Page Numbers Enabled',
  description: 'Verifies that the document has page numbers configured by checking for the presence of header or footer sections.',
  scope: ['document'],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = []
    const doc = context.document

    if (!doc.hasHeaderOrFooter) {
      violations.push({
        ruleId: this.id,
        ruleName: this.name,
        severity: 'error',
        message: 'No page numbers detected. The document does not appear to have headers or footers configured (which are required for page numbering).'
      })
    }

    return violations
  }
}
export default pageNumbersRule
