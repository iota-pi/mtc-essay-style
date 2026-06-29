export interface SblReferenceSpan {
  start: number;   // character offset in the footnote text
  end: number;     // character offset (exclusive)
  type: string;
}

// Common SBL reference prefixes
const PREFIX_PATTERNS = [
  '[Cc]f\\.',
  '[Ss]ee\\s+also:?',
  '[Ss]ee\\s+esp\\.?',
  '[Ss]ee\\s+especially',
  '[Ss]ee\\s+e\\.g\\.,',
  '[Ss]ee,?\\s+esp\\.?,?',
  '[Ss]ee,?\\s+e\\.g\\.,?',
  '[Ss]ee:?',
  '[Ee]\\.g\\.,',
  '[Ii]\\.e\\.,?',
  '[Cc]ontra',
  '[Ff]ollowing',
  '[Ss]o',
  '[Ss]imilarly',
  '[Ee]sp\\.',
  '[Ee]specially',
  '[Aa]lso',
  '[Aa]ccording\\s+to',
  '[Aa]s\\s+argued\\s+(?:in|by)',
  '[Aa]s\\s+discussed\\s+in',
  '[Aa]s\\s+noted\\s+(?:in|by)',
  '[Qq]uoted\\s+in',
  '[Cc]ited\\s+in'
]

const PREFIX_GROUP = PREFIX_PATTERNS.join('|')
export const SBL_PREFIX_REGEX_STR = `(?:(?:${PREFIX_GROUP})\\s+)`
const PREFIX = `(?:${SBL_PREFIX_REGEX_STR})?`

// Author name pattern (capitalized names, initials, optional 'and', '&', commas, 'et al.')
const AUTHOR_SEGMENT = "[A-Z][A-Za-z\\’'-]*\\.?(?:\\s+(?:[A-Z][A-Za-z\\’'-]*\\.?|and|&|de|van|der|von))*"
const AUTHOR = `${AUTHOR_SEGMENT}(?:,\\s+(?:and\\s+)?${AUTHOR_SEGMENT})*(?:\\s+et\\s+al\\.)?`


// Valid referencing keywords (singular and plural abbreviations, e.g. p., pp., art., arts., fol., fols.)
const REF_KEYWORD = '(?:(?:[Pp]p?|[Aa]rts?|[Ff]ols?|[Vv]v?|[Cc]hs?|[Cc]ols?|[Nn]n?|[Nn]os?|[Vv]ols?|[Ff]igs?|[Ss]ecs?)\\.\\s*)?'

const PATTERNS = [
  // 1. Chapter/Section in Edited Volume (First Reference)
  // e.g. Harold W. Attridge, "Jewish Historiography," in Early Judaism and Its Modern Interpreters, ed. Robert A. Kraft (Philadelphia: Fortress, 1986), 311–43.
  {
    type: 'chapter-first',
    regex: new RegExp(
      `^${PREFIX}${AUTHOR},\\s+(?:[“"][^“”"]*?[”"]|[‘'][^‘’']*?[’']),?\\s+[Ii]n\\s+[^,]+,\\s*(?:[Ee]d\\.|[Tt]rans\\.|[Ee]dited\\s+by)\\s+[^(\\n]+\\((?:[^)]+?:\\s*)?[^)]*?\\d{4}\\)(?:,\\s*${REF_KEYWORD}\\d+[\\d\\s–,-]*\\b)?\\.?`
    )
  },
  // 2. Journal Article (First Reference)
  // e.g. Blake Leyerle, "John Chrysostom on the Gaze," JECS 1 (1993): 159–74.
  {
    type: 'journal-first',
    regex: new RegExp(
      `^${PREFIX}${AUTHOR},\\s+(?:[“"][^“”"]*?[”"]|[‘'][^‘’']*?[’']),?\\s+[^(\\n]+\\s+\\d+(?:\\.\\d+)?\\s*\\(\\d{4}\\)(?::\\s*\\d+[\\d\\s–,-]*\\b)?\\.?`
    )
  },
  // 3. Book (First Reference)
  // e.g. Charles H. Talbert, Reading John: A Literary and Theological Commentary (New York: Crossroad, 1992), 127.
  {
    type: 'book-first',
    regex: new RegExp(
      `^${PREFIX}${AUTHOR},\\s+[^(\\n]+\\((?:[^)]+?:\\s*)?[^)]*?\\d{4}\\)(?:,\\s*${REF_KEYWORD}\\d+[\\d\\s–,-]*\\b)?\\.?`
    )
  },
  // 4. Short / Subsequent Reference (Book, Journal, or Chapter)
  // e.g. Talbert, Reading John, 145.
  // e.g. Leyerle, "John Chrysostom," 162.
  {
    type: 'short-reference',
    regex: new RegExp(
      `^${PREFIX}${AUTHOR},\\s+(?:(?:[“"][^“”"]*?[”"]|[‘'][^‘’']*?[’'])(?:,\\s*|\\s*)|[^,]+,\\s*)${REF_KEYWORD}\\d+[\\d\\s–,-]*\\b\\.?`
    )
  },
  // 5. Ibid. Reference
  // e.g. Ibid., 145.
  {
    type: 'ibid-reference',
    regex: new RegExp(
      `^${PREFIX}[Ii]bid\\.(?:,\\s*${REF_KEYWORD}\\d+[\\d\\s–,-]*\\b\\.?)?`
    )
  }
]

/**
 * Detects character spans within footnote text that match SBL v2 bibliographic references.
 * Support multi-citation separators (semicolons), parenthetical citations, and trailing commentary.
 */
export function detectSblReferences(text: string): SblReferenceSpan[] {
  const spans: SblReferenceSpan[] = []

  function addSpan(start: number, end: number, type: string) {
    // Check if this span is already covered by a larger or equal span
    const isCovered = spans.some(s => start >= s.start && end <= s.end)
    if (isCovered) return

    // Remove any existing smaller spans that are covered by this new larger span
    for (let i = spans.length - 1; i >= 0; i--) {
      const s = spans[i]
      if (s.start >= start && s.end <= end) {
        spans.splice(i, 1)
      }
    }

    spans.push({ start, end, type })
  }

  // Find valid citation separators (semicolons not inside parentheses or quotes)
  const separators: number[] = []
  let parenDepth = 0
  let inDoubleQuotes = false
  let inSingleQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '(') {
      parenDepth += 1
    } else if (c === ')') {
      if (parenDepth > 0) parenDepth -= 1
    } else if (c === '“' || c === '”' || c === '"') {
      inDoubleQuotes = !inDoubleQuotes
    } else if (c === '‘' || c === '’' || c === '\'') {
      const isApostrophe = (i > 0 && /\w/.test(text[i-1])) && (i < text.length - 1 && /\w/.test(text[i+1]))
      if (!isApostrophe) {
        inSingleQuotes = !inSingleQuotes
      }
    } else if (c === ';' && parenDepth === 0 && !inDoubleQuotes && !inSingleQuotes) {
      separators.push(i)
    }
  }

  const segments: { text: string; start: number; end: number }[] = []
  let lastIdx = 0
  for (const sep of separators) {
    segments.push({
      text: text.substring(lastIdx, sep),
      start: lastIdx,
      end: sep
    })
    lastIdx = sep + 1
  }
  segments.push({
    text: text.substring(lastIdx),
    start: lastIdx,
    end: text.length
  })

  for (const seg of segments) {
    const trimmed = seg.text.trim()
    if (!trimmed) continue

    const segmentTrimOffset = seg.text.indexOf(trimmed)
    const trimStart = seg.start + segmentTrimOffset

    let matched = false

    // Check full trimmed segment
    for (const pat of PATTERNS) {
      const m = pat.regex.exec(trimmed)
      if (m) {
        const mStart = trimStart + m.index
        const mEnd = mStart + m[0].length
        addSpan(mStart, mEnd, pat.type)
        matched = true
        break
      }
    }

    if (matched) continue

    // Check for inline prefixes (e.g. "see...", "cf...")
    const prefixRegex = new RegExp(`\\b(${PREFIX_GROUP})\\s+`, 'gi')
    let pMatch
    while ((pMatch = prefixRegex.exec(seg.text)) !== null) {
      const rightText = seg.text.substring(pMatch.index).trim()
      const rightStart = seg.start + pMatch.index

      for (const pat of PATTERNS) {
        const m = pat.regex.exec(rightText)
        if (m) {
          const mStart = rightStart + m.index
          const mEnd = mStart + m[0].length
          addSpan(mStart, mEnd, pat.type)
          matched = true
          break
        }
      }
      if (matched) break
    }

    if (matched) continue

    // Check inside parentheses
    const parenRegex = /\(([^)]+)\)/g
    let parenMatch
    while ((parenMatch = parenRegex.exec(seg.text)) !== null) {
      const innerText = parenMatch[1].trim()
      const innerStart = seg.start + parenMatch.index + parenMatch[0].indexOf(innerText)

      for (const pat of PATTERNS) {
        const m = pat.regex.exec(innerText)
        if (m) {
          const mStart = innerStart + m.index
          const mEnd = mStart + m[0].length
          addSpan(mStart, mEnd, pat.type)
          matched = true
          break
        }
      }
      if (matched) continue

      let innerPMatch
      const innerPrefixRegex = new RegExp(`\\b(${PREFIX_GROUP})\\s+`, 'gi')
      while ((innerPMatch = innerPrefixRegex.exec(innerText)) !== null) {
        const rightInnerText = innerText.substring(innerPMatch.index).trim()
        const rightInnerStart = innerStart + innerPMatch.index

        for (const pat of PATTERNS) {
          const m = pat.regex.exec(rightInnerText)
          if (m) {
            const mStart = rightInnerStart + m.index
            const mEnd = mStart + m[0].length
            addSpan(mStart, mEnd, pat.type)
            matched = true
            break
          }
        }
        if (matched) break
      }
    }
  }

  return spans.sort((a, b) => a.start - b.start)
}

/**
 * Checks if a specific index within the text falls inside any detected SBL reference spans.
 */
export function isWithinReference(index: number, spans: SblReferenceSpan[]): boolean {
  return spans.some(s => index >= s.start && index < s.end)
}

/**
 * Helper to determine if a footnote text contains any SBL reference spans.
 */
export function isSblReferenceFootnote(text: string): boolean {
  return detectSblReferences(text).length > 0
}
