import { StyleRule, StyleViolation } from '../types'
import { getParagraphText, findParagraphIndex, getRegionForParagraph } from '../utils'

export const quotationPunctuationRule: StyleRule = {
  id: 'sbl-quotation-punctuation',
  name: 'Quotation Mark and Citation Punctuation',
  description: 'Checks that commas and periods are placed inside closing quotation marks, colons and semicolons are placed outside, and footnote reference numbers follow quotation marks and punctuation.',
  scope: ['body'],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = []
    const doc = context.document
    const sections = context.sections

    // 1. Commas/periods outside closing double quotes
    // Matches a double quote (straight or curly) followed by a comma or period
    const commaPeriodOutsideRegex = /(["”])([.,])/g

    // 2. Colons/semicolons inside closing double quotes
    // Matches a colon or semicolon followed by a double quote
    const colonSemicolonInsideRegex = /([;:])(["”])/g

    // 3. Footnote placement
    // Footnote reference numbers should follow closing quotes and punctuation
    const trailingPunctuationRegex = /^[\s]*([.,;:!?)"”’]+)/

    for (const para of doc.paragraphs) {
      const text = getParagraphText(para)
      const pIndex = findParagraphIndex(para, doc)
      const region = getRegionForParagraph(para, sections)

      if (region === 'title-page' || region === 'bibliography') {
        continue
      }

      // Check commas/periods outside closing quotes
      commaPeriodOutsideRegex.lastIndex = 0
      let match
      while ((match = commaPeriodOutsideRegex.exec(text)) !== null) {
        const fullMatch = match[0]
        const quote = match[1]
        const punctuation = match[2]
        const expected = punctuation + quote

        violations.push({
          ruleId: this.id,
          ruleName: this.name,
          severity: 'error',
          message: `Punctuation "${punctuation}" placed outside closing quotation mark in "${fullMatch}". SBL style requires periods and commas to be placed inside quotation marks (expected "${expected}").`,
          paragraphIndex: pIndex,
          region,
          detail: `Snippet: "...${text.substring(Math.max(0, match.index - 10), Math.min(text.length, match.index + 10))}..."`
        })
      }

      // Check colons/semicolons inside closing quotes
      colonSemicolonInsideRegex.lastIndex = 0
      while ((match = colonSemicolonInsideRegex.exec(text)) !== null) {
        const fullMatch = match[0]
        const punctuation = match[1]
        const quote = match[2]
        const expected = quote + punctuation

        violations.push({
          ruleId: this.id,
          ruleName: this.name,
          severity: 'error',
          message: `Punctuation "${punctuation}" placed inside closing quotation mark in "${fullMatch}". SBL style requires colons and semicolons to be placed outside quotation marks (expected "${expected}").`,
          paragraphIndex: pIndex,
          region,
          detail: `Snippet: "...${text.substring(Math.max(0, match.index - 10), Math.min(text.length, match.index + 10))}..."`
        })
      }

      // Check footnote reference placement
      for (let i = 0; i < para.runs.length; i++) {
        const run = para.runs[i]
        if (run.footnoteId !== undefined) {
          // Reconstruct text after this run
          const textAfter = para.runs
            .slice(i + 1)
            .map(r => r.text)
            .join('')

          const puncMatch = trailingPunctuationRegex.exec(textAfter)
          if (puncMatch) {
            const forbiddenPunc = puncMatch[1]
            violations.push({
              ruleId: this.id,
              ruleName: this.name,
              severity: 'error',
              message: `Footnote reference (ID ${run.footnoteId}) is placed before punctuation/closing quotes "${forbiddenPunc}". SBL style requires footnote reference numbers to follow closing quotation marks and punctuation (except dashes).`,
              paragraphIndex: pIndex,
              region,
              detail: `Text around footnote: "...${getParagraphText(para).substring(Math.max(0, text.indexOf(run.text) - 15), Math.min(text.length, text.indexOf(run.text) + 15))}..."`
            })
          }
        }
      }
    }

    return violations
  }
}
export default quotationPunctuationRule
