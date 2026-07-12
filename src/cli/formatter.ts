import chalk from 'chalk'
import { CheckResult, StyleViolation } from '../rules/index'
import * as path from 'path'

export function formatText(result: CheckResult, filePath: string, minSeverity: string): string {
  const filename = path.basename(filePath)
  const lines: string[] = []

  lines.push(chalk.bold.cyan(`=== Style Check Results for: ${filename} ===`))
  lines.push('')

  // Word counts
  lines.push(chalk.bold('Word Count Summary:'))
  lines.push(`  Total Words: ${chalk.bold.green(result.wordCount.total)}`)
  lines.push(`  - Body Text: ${result.wordCount.bodyText}`)
  lines.push(`  - Footnotes: ${result.wordCount.footnotes}`)
  lines.push('')

  // Violations
  const severityValue = {
    info: 0,
    warning: 1,
    error: 2
  }
  const minVal = severityValue[minSeverity.toLowerCase() as keyof typeof severityValue] ?? 0

  const filteredViolations = result.violations.filter(v => {
    const val = severityValue[v.severity.toLowerCase() as keyof typeof severityValue] ?? 0
    return val >= minVal
  })

  lines.push(chalk.bold(`Style Violations (${filteredViolations.length} reported):`))

  if (filteredViolations.length === 0) {
    lines.push(chalk.green('  ✔ No violations found.'))
  } else {
    // Group by severity
    const errors = filteredViolations.filter(v => v.severity === 'error')
    const warnings = filteredViolations.filter(v => v.severity === 'warning')
    const infos = filteredViolations.filter(v => v.severity === 'info')

    const printGroup = (title: string, list: StyleViolation[], colorFn: (s: string) => string) => {
      if (list.length === 0) return
      lines.push(`  ${colorFn(title)}:`)
      for (const v of list) {
        lines.push(`    - [${v.ruleId}] ${v.message}`)

        // Context line
        const contextParts: string[] = []
        if (v.paragraphIndex !== undefined) {
          contextParts.push(`Paragraph ${v.paragraphIndex + 1}`)
        }

        let footnoteId: string | undefined
        if (v.detail) {
          const fnMatch = v.detail.match(/Footnote ID:\s*(\S+)/i)
          if (fnMatch) {
            footnoteId = fnMatch[1]
          }
        }

        if (footnoteId !== undefined) {
          contextParts.push(`Footnote ${footnoteId}`)
        }

        if (v.paragraphSnippet) {
          contextParts.push(`starting "${v.paragraphSnippet}"`)
        }

        let regionText: string | undefined = v.region
        if (!regionText && footnoteId !== undefined) {
          regionText = 'footnote'
        }

        if (contextParts.length > 0) {
          let contextLine = '      ' + contextParts[0]
          if (contextParts.length > 1) {
            contextLine += ` (${contextParts.slice(1).join(', ')})`
          }
          if (regionText) {
            contextLine += `, in ${regionText}`
          }
          lines.push(contextLine)
        }

        // Correction line
        if (v.correction) {
          lines.push(`      ❌ "${chalk.red(v.correction.found)}" → ✅ "${chalk.green(v.correction.expected)}"`)
        }
      }
    }

    printGroup('Errors', errors, chalk.bold.red)
    printGroup('Warnings', warnings, chalk.bold.yellow)
    printGroup('Info', infos, chalk.bold.blue)
  }

  return lines.join('\n')
}

export function formatJson(result: CheckResult, filePath: string): string {
  return JSON.stringify({
    file: filePath,
    wordCount: result.wordCount,
    violations: result.violations.map(v => ({
      ruleId: v.ruleId,
      ruleName: v.ruleName,
      severity: v.severity,
      message: v.message,
      paragraphIndex: v.paragraphIndex,
      region: v.region,
      correction: v.correction,
      paragraphSnippet: v.paragraphSnippet
    }))
  }, null, 2)
}

