import { StyleRule, StyleViolation } from '../types'

export const bibliographyRequiredRule: StyleRule = {
  id: 'sbl-bibliography-required',
  name: 'Bibliography Required',
  description: 'Checks that the document has a bibliography section at the end.',
  scope: ['document'],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = []
    if (!context.sections.hasBibliography) {
      violations.push({
        ruleId: this.id,
        ruleName: this.name,
        severity: 'error',
        message: "No bibliography section detected at the end of the document. Ensure you have a bibliography page with a heading like 'Bibliography' or 'References'."
      })
    }
    return violations
  }
}

export default bibliographyRequiredRule
