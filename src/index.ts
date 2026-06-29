export { parseDocx } from './docx/parser'
export { resolveRunProperties, resolveParagraphProperties } from './docx/style-resolver'
export { classifySections } from './analysis/sections'
export { countWords, countWordsInText } from './analysis/word-count'
export {
  defaultRegistry,
  RuleRegistry,
  runChecks
} from './rules/index'

export type {
  ParsedDocument,
  DocxParagraph,
  DocxRun,
  DocxStyle,
  DocxFootnote,
  RunProperties,
  ParagraphProperties,
  LineSpacing,
  Indentation
} from './docx/types'

export type {
  DocumentSections,
  DocumentRegion
} from './analysis/sections'

export type {
  WordCountResult
} from './analysis/word-count'

export type {
  StyleRule,
  StyleViolation,
  RuleContext,
  RuleScope,
  Severity,
  CheckResult
} from './rules/index'
