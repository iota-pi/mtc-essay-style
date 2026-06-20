export { parseDocx } from "./docx/parser.js";
export { resolveRunProperties, resolveParagraphProperties } from "./docx/style-resolver.js";
export { classifySections } from "./analysis/sections.js";
export { countWords, countWordsInText } from "./analysis/word-count.js";
export {
  defaultRegistry,
  RuleRegistry,
  runChecks
} from "./rules/index.js";

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
} from "./docx/types.js";

export type {
  DocumentSections,
  DocumentRegion
} from "./analysis/sections.js";

export type {
  WordCountResult
} from "./analysis/word-count.js";

export type {
  StyleRule,
  StyleViolation,
  RuleContext,
  RuleScope,
  Severity,
  CheckResult
} from "./rules/index.js";
