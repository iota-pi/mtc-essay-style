import { StyleRule, StyleViolation } from '../types'
import { getParagraphText, findParagraphIndex } from '../utils'

export const bodyEndashRule: StyleRule = {
  id: 'format-body-endash',
  name: 'Body Text En-dash Check',
  description: 'Checks that en-dashes (–) are not used in the body text except to indicate ranges between numbers.',
  scope: ['body'],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = []
    const doc = context.document
    const sections = context.sections

    const bodyParagraphs = sections.body

    for (const para of bodyParagraphs) {
      const text = getParagraphText(para)
      const pIndex = findParagraphIndex(para, doc)

      // Find all en-dashes (\u2013)
      const endashRegex = /–/g
      let match

      while ((match = endashRegex.exec(text)) !== null) {
        const index = match.index

        // Check character before en-dash (ignoring whitespace)
        const beforeSubstring = text.substring(0, index)
        const endsWithDigit = /\d\s*$/.test(beforeSubstring)

        // Check character after en-dash (ignoring whitespace)
        const afterSubstring = text.substring(index + 1)
        const startsWithDigit = /^\s*\d/.test(afterSubstring)

        // It is valid ONLY if both sides have digits
        const isValidRange = endsWithDigit && startsWithDigit

        if (!isValidRange) {
          const startSnippet = Math.max(0, index - 15)
          const endSnippet = Math.min(text.length, index + 16)
          const snippet = text.substring(startSnippet, endSnippet)

          violations.push({
            ruleId: this.id,
            ruleName: this.name,
            severity: 'warning', // Explicitly a warning per request
            message: 'En-dash (–) used incorrectly in body text. En-dashes should only be used between numbers to indicate a range; use an em-dash (—) or hyphen (-) for other punctuation purposes.',
            paragraphIndex: pIndex,
            region: 'body',
            detail: `Snippet: "...${snippet}..."`
          })
        }
      }
    }

    return violations
  }
}
export default bodyEndashRule
