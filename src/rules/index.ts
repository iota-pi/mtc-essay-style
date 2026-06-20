import { RuleRegistry } from "./registry.js";
import { bibleRefsInFootnotesRule } from "./definitions/bible-refs-in-footnotes.js";
import { bibleRefFormatRule } from "./definitions/bible-ref-format.js";
import { bibleBookAbbreviationsRule } from "./definitions/bible-book-abbreviations.js";
import { abbreviationStyleRule } from "./definitions/abbreviation-style.js";
import { quotationPunctuationRule } from "./definitions/quotation-punctuation.js";
import { pageNumbersRule } from "./definitions/page-numbers.js";
import { lineSpacingRule } from "./definitions/line-spacing.js";
import { fontSizeRule } from "./definitions/font-size.js";
import { bibleConsecutiveRefsRule } from "./definitions/bible-consecutive-refs.js";
import { bibleRangeEndashRule } from "./definitions/bible-range-endash.js";
import { bodyEndashRule } from "./definitions/body-endash.js";

// Import and register all style rules.
export const defaultRegistry = new RuleRegistry();
defaultRegistry.registerAll([
  bibleRefsInFootnotesRule,
  bibleRefFormatRule,
  bibleBookAbbreviationsRule,
  abbreviationStyleRule,
  quotationPunctuationRule,
  pageNumbersRule,
  lineSpacingRule,
  fontSizeRule,
  bibleConsecutiveRefsRule,
  bibleRangeEndashRule,
  bodyEndashRule
]);

export { RuleRegistry } from "./registry.js";
export { runChecks } from "./runner.js";
export type { StyleRule, StyleViolation, RuleContext, RuleScope, Severity } from "./types.js";
export type { CheckResult } from "./runner.js";
