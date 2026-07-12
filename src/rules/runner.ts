import { ParsedDocument } from '../docx/types'
import { DocumentSections } from '../analysis/sections'
import { WordCountResult, countWords } from '../analysis/word-count'
import { RuleRegistry } from './registry'
import { StyleViolation, RuleContext } from './types'
import { resolveRunProperties, resolveParagraphProperties } from '../docx/style-resolver'

export interface CheckResult {
  violations: StyleViolation[];
  wordCount: WordCountResult;
  sections: DocumentSections;
  rulesRun: number;
}

export function runChecks(
  doc: ParsedDocument,
  sections: DocumentSections,
  registry: RuleRegistry
): CheckResult {
  const violations: StyleViolation[] = []
  const wordCount = countWords(doc, sections)

  // Context to pass to each rule
  const context: RuleContext = {
    document: doc,
    sections,
    resolveRunProperties: (run, para) => resolveRunProperties(run, para, doc),
    resolveParagraphProperties: para => resolveParagraphProperties(para, doc)
  }

  // Run all registered rules
  const rules = registry.getAll()
  for (const rule of rules) {
    try {
      const ruleViolations = rule.check(context)
      violations.push(...ruleViolations)
    } catch (err: unknown) {
      violations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        severity: 'error',
        message: `Error executing rule: ${err instanceof Error ? err.message : String(err)}`,
      })
    }
  }

  return {
    violations,
    wordCount,
    sections,
    rulesRun: rules.length
  }
}
