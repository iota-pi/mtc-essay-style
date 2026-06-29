import { StyleRule, StyleViolation } from '../types'
import { getParagraphText, isHeading, findParagraphIndex } from '../utils'

export const fontSizeRule: StyleRule = {
  id: 'format-font-size',
  name: 'Font Size 12pt',
  description: 'Verifies that body text paragraphs use exactly 12pt font size.',
  scope: ['body'],
  check(context): StyleViolation[] {
    const violations: StyleViolation[] = []
    const doc = context.document
    const sections = context.sections

    const bodyParagraphs = sections.body

    for (const para of bodyParagraphs) {
      // Skip empty paragraphs
      if (getParagraphText(para).trim() === '') {
        continue
      }

      // Skip headings
      if (isHeading(para, context)) {
        continue
      }

      interface NonCompliantSegment {
        text: string;
        size: number;
      }
      const segments: NonCompliantSegment[] = []
      let currentSegment: NonCompliantSegment | null = null

      for (const run of para.runs) {
        if (run.text.trim() === '') {
          if (currentSegment) {
            currentSegment.text += run.text
          }
          continue
        }

        if (run.footnoteId !== undefined) {
          if (currentSegment) {
            segments.push(currentSegment)
            currentSegment = null
          }
          continue
        }

        const resolved = context.resolveRunProperties(run, para)
        const size = resolved.fontSize

        const defaultSize = doc.defaultRunProperties?.fontSize ||
                            doc.styles.get('Normal')?.runProperties?.fontSize ||
                            doc.styles.get('normal')?.runProperties?.fontSize

        const isCompliant = size === 24 || (size === undefined && defaultSize === 24)

        if (!isCompliant) {
          const runSize = size !== undefined ? size / 2 : 0
          if (currentSegment && currentSegment.size === runSize) {
            currentSegment.text += run.text
          } else {
            if (currentSegment) {
              segments.push(currentSegment)
            }
            currentSegment = { text: run.text, size: runSize }
          }
        } else {
          if (currentSegment) {
            segments.push(currentSegment)
            currentSegment = null
          }
        }
      }
      if (currentSegment) {
        segments.push(currentSegment)
      }

      if (segments.length > 0) {
        const pIndex = findParagraphIndex(para, doc)
        const segmentDescriptions = segments.map(seg => {
          const textToAbridge = seg.text.trim()
          const abridgedText = textToAbridge.length > 25 ? textToAbridge.substring(0, 25).trimEnd() + '...' : textToAbridge
          const sizeStr = seg.size === 0 ? 'default size' : `${seg.size}pt`
          return `"${abridgedText}" (${sizeStr})`
        })

        violations.push({
          ruleId: this.id,
          ruleName: this.name,
          severity: 'error',
          message: `Paragraph contains text that is not 12pt: ${segmentDescriptions.join(', ')}. All body text must be exactly 12pt.`,
          paragraphIndex: pIndex,
          region: 'body',
          detail: `Non-compliant text: ${segments.map(s => `"${s.text}"`).join(', ')}`
        })
      }
    }

    return violations
  }
}
export default fontSizeRule
