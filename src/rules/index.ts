import { RuleRegistry } from './registry'
import { bibleRefsInFootnotesRule } from './definitions/bible-refs-in-footnotes'
import { bibleRefFormatRule } from './definitions/bible-ref-format'
import { bibleBookAbbreviationsRule } from './definitions/bible-book-abbreviations'
import { abbreviationStyleRule } from './definitions/abbreviation-style'
import { quotationPunctuationRule } from './definitions/quotation-punctuation'
import { pageNumbersRule } from './definitions/page-numbers'
import { lineSpacingRule } from './definitions/line-spacing'
import { fontSizeRule } from './definitions/font-size'
import { bibleConsecutiveRefsRule } from './definitions/bible-consecutive-refs'
import { bibleRangeEndashRule } from './definitions/bible-range-endash'
import { bodyEndashRule } from './definitions/body-endash'
import { sblReferenceAbbreviationsRule } from './definitions/sbl-reference-abbreviations'
import { greekHebrewQuotesRule } from './definitions/greek-hebrew-quotes'
import { quotationEllipsisRule } from './definitions/quotation-ellipsis'
import { bibliographyRequiredRule } from './definitions/bibliography-required'
import { footnoteCitationFormatRule } from './definitions/footnote-citation-format'
import { bibliographyCompletenessRule } from './definitions/bibliography-completeness'
import { multipleWhitespacesRule } from './definitions/multiple-whitespaces'

// Import and register all style rules.
export const defaultRegistry = new RuleRegistry()
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
  bodyEndashRule,
  sblReferenceAbbreviationsRule,
  greekHebrewQuotesRule,
  quotationEllipsisRule,
  bibliographyRequiredRule,
  footnoteCitationFormatRule,
  bibliographyCompletenessRule,
  multipleWhitespacesRule
])

export { RuleRegistry } from './registry'
export { runChecks } from './runner'
export type { StyleRule, StyleViolation, RuleContext, RuleScope, Severity } from './types'
export type { CheckResult } from './runner'
