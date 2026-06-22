/**
 * Canonical SBL Book Abbreviations and Names (2nd Edition)
 */

export const SBL_BOOK_MAP = new Map<string, string>([
  // Old Testament
  ["genesis", "Gen"],
  ["exodus", "Exod"],
  ["leviticus", "Lev"],
  ["numbers", "Num"],
  ["deuteronomy", "Deut"],
  ["joshua", "Josh"],
  ["judges", "Judg"],
  ["ruth", "Ruth"],
  ["1 samuel", "1 Sam"],
  ["2 samuel", "2 Sam"],
  ["1 kings", "1 Kgs"],
  ["2 kings", "2 Kgs"],
  ["1 chronicles", "1 Chr"],
  ["2 chronicles", "2 Chr"],
  ["ezra", "Ezra"],
  ["nehemiah", "Neh"],
  ["esther", "Esth"],
  ["job", "Job"],
  ["psalm", "Ps"],
  ["psalms", "Ps"], // Pss is also valid for plural, handled separately
  ["proverbs", "Prov"],
  ["ecclesiastes", "Eccl"],
  ["qoh", "Qoh"],
  ["qoheleth", "Qoh"],
  ["song of songs", "Song"],
  ["canticles", "Cant"],
  ["canticle of canticles", "Cant"],
  ["isaiah", "Isa"],
  ["jeremiah", "Jer"],
  ["lamentations", "Lam"],
  ["ezekiel", "Ezek"],
  ["daniel", "Dan"],
  ["hosea", "Hos"],
  ["joel", "Joel"],
  ["amos", "Amos"],
  ["obadiah", "Obad"],
  ["jonah", "Jonah"],
  ["micah", "Mic"],
  ["nahum", "Nah"],
  ["habakkuk", "Hab"],
  ["zephaniah", "Zeph"],
  ["haggai", "Hag"],
  ["zechariah", "Zech"],
  ["malachi", "Mal"],

  // New Testament
  ["matthew", "Matt"],
  ["mark", "Mark"],
  ["luke", "Luke"],
  ["john", "John"],
  ["acts", "Acts"],
  ["romans", "Rom"],
  ["1 corinthians", "1 Cor"],
  ["2 corinthians", "2 Cor"],
  ["galatians", "Gal"],
  ["ephesians", "Eph"],
  ["philippians", "Phil"],
  ["colossians", "Col"],
  ["1 thessalonians", "1 Thess"],
  ["2 thessalonians", "2 Thess"],
  ["1 timothy", "1 Tim"],
  ["2 timothy", "2 Tim"],
  ["titus", "Titus"],
  ["philemon", "Phlm"],
  ["hebrews", "Heb"],
  ["james", "Jas"],
  ["1 peter", "1 Pet"],
  ["2 peter", "2 Pet"],
  ["1 john", "1 John"],
  ["2 john", "2 John"],
  ["3 john", "3 John"],
  ["jude", "Jude"],
  ["revelation", "Rev"],

  // Apocrypha / Deuterocanonical
  ["tobit", "Tob"],
  ["judith", "Jdt"],
  ["additions to esther", "Add Esth"],
  ["wisdom of solomon", "Wis"],
  ["sirach", "Sir"],
  ["baruch", "Bar"],
  ["epistle of jeremiah", "Ep Jer"],
  ["additions to daniel", "Add Dan"],
  ["prayer of azariah", "Pr Azar"],
  ["bel and the dragon", "Bel"],
  ["song of the three young men", "Sg Three"],
  ["susanna", "Sus"],
  ["1 maccabees", "1 Macc"],
  ["2 maccabees", "2 Macc"],
  ["3 maccabees", "3 Macc"],
  ["4 maccabees", "4 Macc"],
  ["1 esdras", "1 Esd"],
  ["2 esdras", "2 Esd"],
  ["prayer of manasseh", "Pr Man"],
  ["psalm 151", "Ps 151"]
]);

export const SBL_VALID_ABBREVIATIONS = new Set<string>([
  // OT
  "Gen", "Exod", "Lev", "Num", "Deut", "Josh", "Judg", "Ruth", 
  "1 Sam", "2 Sam", "1 Kgs", "2 Kgs", "1 Chr", "2 Chr", "Ezra", "Neh", "Esth", "Job", 
  "Ps", "Pss", "Prov", "Eccl", "Qoh", "Song", "Cant", "Isa", "Jer", "Lam", "Ezek", "Dan", 
  "Hos", "Joel", "Amos", "Obad", "Jonah", "Mic", "Nah", "Hab", "Zeph", "Hag", "Zech", "Mal",
  // NT
  "Matt", "Mark", "Luke", "John", "Acts", "Rom", "1 Cor", "2 Cor", "Gal", "Eph", "Phil", "Col", 
  "1 Thess", "2 Thess", "1 Tim", "2 Tim", "Titus", "Phlm", "Heb", "Jas", "1 Pet", "2 Pet", 
  "1 John", "2 John", "3 John", "Jude", "Rev",
  // Apocrypha
  "Tob", "Jdt", "Add Esth", "Wis", "Sir", "Bar", "Ep Jer", "Add Dan", "Pr Azar", "Bel", 
  "Sg Three", "Sus", "1 Macc", "2 Macc", "3 Macc", "4 Macc", "1 Esd", "2 Esd", "Pr Man", "Ps 151"
]);

export const SBL_ABBREV_TO_FULL = new Map<string, string>([
  ["gen", "Genesis"],
  ["exod", "Exodus"],
  ["lev", "Leviticus"],
  ["num", "Numbers"],
  ["deut", "Deuteronomy"],
  ["josh", "Joshua"],
  ["judg", "Judges"],
  ["ruth", "Ruth"],
  ["1 sam", "1 Samuel"],
  ["2 sam", "2 Samuel"],
  ["1 kgs", "1 Kings"],
  ["2 kgs", "2 Kings"],
  ["1 chr", "1 Chronicles"],
  ["2 chr", "2 Chronicles"],
  ["ezra", "Ezra"],
  ["neh", "Nehemiah"],
  ["esth", "Esther"],
  ["job", "Job"],
  ["ps", "Psalms"],
  ["pss", "Psalms"],
  ["prov", "Proverbs"],
  ["eccl", "Ecclesiastes"],
  ["qoh", "Qoheleth"],
  ["song", "Song of Songs"],
  ["cant", "Canticles"],
  ["isa", "Isaiah"],
  ["jer", "Jeremiah"],
  ["lam", "Lamentations"],
  ["ezek", "Ezekiel"],
  ["dan", "Daniel"],
  ["hos", "Hosea"],
  ["joel", "Joel"],
  ["amos", "Amos"],
  ["obad", "Obadiah"],
  ["jonah", "Jonah"],
  ["mic", "Micah"],
  ["nah", "Nahum"],
  ["hab", "Habakkuk"],
  ["zeph", "Zephaniah"],
  ["hag", "Haggai"],
  ["zech", "Zechariah"],
  ["mal", "Malachi"],
  ["matt", "Matthew"],
  ["mark", "Mark"],
  ["luke", "Luke"],
  ["john", "John"],
  ["acts", "Acts"],
  ["rom", "Romans"],
  ["1 cor", "1 Corinthians"],
  ["2 cor", "2 Corinthians"],
  ["gal", "Galatians"],
  ["eph", "Ephesians"],
  ["phil", "Philippians"],
  ["col", "Colossians"],
  ["1 thess", "1 Thessalonians"],
  ["2 thess", "2 Thessalonians"],
  ["1 tim", "1 Timothy"],
  ["2 tim", "2 Timothy"],
  ["titus", "Titus"],
  ["phlm", "Philemon"],
  ["heb", "Hebrews"],
  ["jas", "James"],
  ["1 pet", "1 Peter"],
  ["2 pet", "2 Peter"],
  ["1 john", "1 John"],
  ["2 john", "2 John"],
  ["3 john", "3 John"],
  ["jude", "Jude"],
  ["rev", "Revelation"],
  ["tob", "Tobit"],
  ["jdt", "Judith"],
  ["add esth", "Additions to Esther"],
  ["wis", "Wisdom of Solomon"],
  ["sir", "Sirach"],
  ["bar", "Baruch"],
  ["ep jer", "Epistle of Jeremiah"],
  ["add dan", "Additions to Daniel"],
  ["pr azar", "Prayer of Azariah"],
  ["bel", "Bel and the Dragon"],
  ["sg three", "Song of the Three Young Men"],
  ["sus", "Susanna"],
  ["1 macc", "1 Maccabees"],
  ["2 macc", "2 Maccabees"],
  ["3 macc", "3 Maccabees"],
  ["4 macc", "4 Maccabees"],
  ["1 esd", "1 Esdras"],
  ["2 esd", "2 Esdras"],
  ["pr man", "Prayer of Manasseh"],
  ["ps 151", "Psalm 151"]
]);

export const COMMON_WRONG_ABBREVIATIONS = new Map<string, string>([
  // Period versions
  ["gen.", "Gen"],
  ["exod.", "Exod"],
  ["lev.", "Lev"],
  ["num.", "Num"],
  ["deut.", "Deut"],
  ["josh.", "Josh"],
  ["judg.", "Judg"],
  ["neh.", "Neh"],
  ["esth.", "Esth"],
  ["ps.", "Ps"],
  ["pss.", "Pss"],
  ["prov.", "Prov"],
  ["eccl.", "Eccl"],
  ["qoh.", "Qoh"],
  ["song.", "Song"],
  ["cant.", "Cant"],
  ["isa.", "Isa"],
  ["jer.", "Jer"],
  ["lam.", "Lam"],
  ["ezek.", "Ezek"],
  ["dan.", "Dan"],
  ["hos.", "Hos"],
  ["mic.", "Mic"],
  ["nah.", "Nah"],
  ["hab.", "Hab"],
  ["zeph.", "Zeph"],
  ["hag.", "Hag"],
  ["zech.", "Zech"],
  ["mal.", "Mal"],
  ["matt.", "Matt"],
  ["rom.", "Rom"],
  ["gal.", "Gal"],
  ["eph.", "Eph"],
  ["phil.", "Phil"],
  ["col.", "Col"],
  ["phlm.", "Phlm"],
  ["heb.", "Heb"],
  ["jas.", "Jas"],
  ["rev.", "Rev"],
  
  // Non-period but non-SBL
  ["ex", "Exod"],
  ["mk", "Mark"],
  ["lk", "Luke"],
  ["jn", "John"],
  ["php", "Phil"],
  ["php.", "Phil"],
  ["phm", "Phlm"],
  ["phm.", "Phlm"],
  ["apoc", "Rev"],
  ["apoc.", "Rev"],
  
  // Numbered books wrong variants
  ["1sam", "1 Sam"],
  ["1sam.", "1 Sam"],
  ["1 sam.", "1 Sam"],
  ["2sam", "2 Sam"],
  ["2sam.", "2 Sam"],
  ["2 sam.", "2 Sam"],
  ["1kgs", "1 Kgs"],
  ["1kgs.", "1 Kgs"],
  ["1 kgs.", "1 Kgs"],
  ["1kg", "1 Kgs"],
  ["1kg.", "1 Kgs"],
  ["1 kg", "1 Kgs"],
  ["1 kg.", "1 Kgs"],
  ["2kgs", "2 Kgs"],
  ["2kgs.", "2 Kgs"],
  ["2 kgs.", "2 Kgs"],
  ["2kg", "2 Kgs"],
  ["2kg.", "2 Kgs"],
  ["2 kg", "2 Kgs"],
  ["2 kg.", "2 Kgs"],
  ["1chr", "1 Chr"],
  ["1chr.", "1 Chr"],
  ["1 chr.", "1 Chr"],
  ["2chr", "2 Chr"],
  ["2chr.", "2 Chr"],
  ["2 chr.", "2 Chr"],
  ["1cor", "1 Cor"],
  ["1cor.", "1 Cor"],
  ["1 cor.", "1 Cor"],
  ["2cor", "2 Cor"],
  ["2cor.", "2 Cor"],
  ["2 cor.", "2 Cor"],
  ["1thess", "1 Thess"],
  ["1thess.", "1 Thess"],
  ["1 thess.", "1 Thess"],
  ["2thess", "2 Thess"],
  ["2thess.", "2 Thess"],
  ["2 thess.", "2 Thess"],
  ["1th", "1 Thess"],
  ["2th", "2 Thess"],
  ["1tim", "1 Tim"],
  ["1tim.", "1 Tim"],
  ["1 tim.", "1 Tim"],
  ["2tim", "2 Tim"],
  ["2tim.", "2 Tim"],
  ["2 tim.", "2 Tim"],
  ["1pet", "1 Pet"],
  ["1pet.", "1 Pet"],
  ["1 pet.", "1 Pet"],
  ["2pet", "2 Pet"],
  ["2pet.", "2 Pet"],
  ["2 pet.", "2 Pet"],
  ["1jn", "1 John"],
  ["1jn.", "1 John"],
  ["1 jn", "1 John"],
  ["1 jn.", "1 John"],
  ["1john.", "1 John"],
  ["1 john.", "1 John"],
  ["2jn", "2 John"],
  ["2jn.", "2 John"],
  ["2 jn", "2 John"],
  ["2 jn.", "2 John"],
  ["2john.", "2 John"],
  ["2 john.", "2 John"],
  ["3jn", "3 John"],
  ["3jn.", "3 John"],
  ["3 jn", "3 John"],
  ["3 jn.", "3 John"],
  ["3john.", "3 John"],
  ["3 john.", "3 John"],
  ["1macc", "1 Macc"],
  ["1macc.", "1 Macc"],
  ["1 macc.", "1 Macc"],
  ["2macc", "2 Macc"],
  ["2macc.", "2 Macc"],
  ["2 macc.", "2 Macc"],
  ["3macc", "3 Macc"],
  ["3macc.", "3 Macc"],
  ["3 macc.", "3 Macc"],
  ["4macc", "4 Macc"],
  ["4macc.", "4 Macc"],
  ["4 macc.", "4 Macc"],
  ["1esd", "1 Esd"],
  ["1esd.", "1 Esd"],
  ["1 esd.", "1 Esd"],
  ["2esd", "2 Esd"],
  ["2esd.", "2 Esd"],
  ["2 esd.", "2 Esd"],
  ["prman", "Pr Man"],
  ["prman.", "Pr Man"],
  ["pr man.", "Pr Man"],
  ["ps151", "Ps 151"],
  ["ps 151.", "Ps 151"]
]);

const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const bookNamesSet = new Set<string>();

// 1. Add all standard book names in Title Case, lowercase, and uppercase
for (const val of SBL_BOOK_MAP.values()) {
  bookNamesSet.add(val); // e.g. "Gen", "1 Cor"
  bookNamesSet.add(val.toLowerCase()); // e.g. "gen", "1 cor"
  bookNamesSet.add(val.toUpperCase()); // e.g. "GEN", "1 COR"
  
  const full = SBL_ABBREV_TO_FULL.get(val.toLowerCase()) || val;
  bookNamesSet.add(full); // e.g. "Genesis", "1 Corinthians"
  bookNamesSet.add(full.toLowerCase()); // e.g. "genesis", "1 corinthians"
  bookNamesSet.add(full.toUpperCase()); // e.g. "GENESIS", "1 CORINTHIANS"
}

// 2. Add all SBL valid abbreviations in their standard casing, lowercase, and uppercase
for (const abbrev of SBL_VALID_ABBREVIATIONS) {
  bookNamesSet.add(abbrev);
  bookNamesSet.add(abbrev.toLowerCase());
  bookNamesSet.add(abbrev.toUpperCase());
}

// Helper to capitalize first alphabetical character
function capitalizeWrong(s: string): string {
  const match = s.match(/[a-zA-Z]/);
  if (match && match.index !== undefined) {
    const idx = match.index;
    return s.slice(0, idx) + s.charAt(idx).toUpperCase() + s.slice(idx + 1);
  }
  return s;
}

// 3. Add wrong abbreviations
for (const wrong of COMMON_WRONG_ABBREVIATIONS.keys()) {
  // If the wrong abbreviation is short and conflicts with English words/pronouns (like "ex", "mk", "lk", "jn"):
  // we ONLY match it capitalized (e.g. "Ex", "Mk", "Lk", "Jn") or all-caps ("EX", "MK", "LK", "JN").
  // We do NOT match it in lowercase (e.g. "ex", "mk", "lk", "jn").
  const isShortConflict = ["ex", "mk", "lk", "jn"].includes(wrong.toLowerCase());
  const capitalized = capitalizeWrong(wrong);
  
  if (isShortConflict) {
    bookNamesSet.add(capitalized);
    bookNamesSet.add(wrong.toUpperCase());
  } else {
    bookNamesSet.add(wrong);
    bookNamesSet.add(capitalized);
    bookNamesSet.add(wrong.toLowerCase());
    bookNamesSet.add(wrong.toUpperCase());
  }
}

const sortedBookNames = Array.from(bookNamesSet).sort((a, b) => b.length - a.length);

export const BIBLE_BOOK_PATTERN = new RegExp(
  `\\b(?:${sortedBookNames.map(name => escapeRegExp(name)).join("|")})(?!\\w)`,
  "g"
);

