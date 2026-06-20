import { ParsedDocument } from "../docx/types.js";
import { DocumentSections } from "../analysis/sections.js";
import { WordCountResult, countWords } from "../analysis/word-count.js";
import { RuleRegistry } from "./registry.js";
import { StyleViolation, RuleContext } from "./types.js";
import { resolveRunProperties, resolveParagraphProperties } from "../docx/style-resolver.js";

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
  const violations: StyleViolation[] = [];
  const wordCount = countWords(doc, sections);

  // Context to pass to each rule
  const context: RuleContext = {
    document: doc,
    sections,
    resolveRunProperties: (run, para) => resolveRunProperties(run, para, doc),
    resolveParagraphProperties: (para) => resolveParagraphProperties(para, doc)
  };

  // Run all registered rules
  const rules = registry.getAll();
  for (const rule of rules) {
    try {
      const ruleViolations = rule.check(context);
      violations.push(...ruleViolations);
    } catch (err: any) {
      violations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        severity: "error",
        message: `Error executing rule: ${err.message || err}`
      });
    }
  }

  // Built-in check: warn if no bibliography is detected
  if (!sections.hasBibliography) {
    violations.push({
      ruleId: "builtin-bibliography-check",
      ruleName: "Bibliography Detection",
      severity: "warning",
      message: "No bibliography section detected at the end of the document. Ensure you have a bibliography page with a heading like 'Bibliography' or 'References'."
    });
  }

  return {
    violations,
    wordCount,
    sections,
    rulesRun: rules.length
  };
}
