import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'
import * as fs from 'fs'
import {
  ParsedDocument,
  DocxParagraph,
  DocxRun,
  DocxStyle,
  DocxFootnote,
  RunProperties,
  ParagraphProperties,
  LineSpacing,
  Indentation
} from './types'

// Helper to ensure we always have an array
function ensureArray<T>(val: T | T[] | undefined): T[] {
  if (val === undefined || val === null) return []
  return Array.isArray(val) ? val : [val]
}

// Helper to parse OpenXML boolean/val flags
function parseVal(el: unknown): unknown {
  if (el === undefined || el === null) return undefined
  // If it's an empty object/element (like <w:b/>), it means true
  if (typeof el === 'object') {
    const obj = el as Record<string, unknown>
    if (Object.keys(obj).length === 0) return true
    const val = obj['@_w:val']
    if (val === undefined) return true
    if (val === false || val === 0 || val === 'false' || val === '0' || val === 'none' || val === 'off') {
      return false
    }
    return val
  }
  if (el === '') return true
  return el
}

function getText(wT: unknown): string {
  if (wT === undefined || wT === null) return ''
  if (typeof wT === 'string') return wT
  if (typeof wT === 'number') return String(wT)
  if (typeof wT === 'object') {
    const obj = wT as Record<string, unknown>
    if (obj['#text'] !== undefined) {
      return String(obj['#text'])
    }
  }
  return ''
}

function parseLineSpacing(spacingNode: unknown): LineSpacing | undefined {
  if (!spacingNode || typeof spacingNode !== 'object') return undefined
  const node = spacingNode as Record<string, unknown>
  const spacing: LineSpacing = {}
  if (node['@_w:line'] !== undefined) spacing.line = Number(node['@_w:line'])
  if (node['@_w:lineRule'] !== undefined) spacing.lineRule = String(node['@_w:lineRule'])
  if (node['@_w:before'] !== undefined) spacing.before = Number(node['@_w:before'])
  if (node['@_w:after'] !== undefined) spacing.after = Number(node['@_w:after'])
  return Object.keys(spacing).length > 0 ? spacing : undefined
}

function parseIndentation(indNode: unknown): Indentation | undefined {
  if (!indNode || typeof indNode !== 'object') return undefined
  const node = indNode as Record<string, unknown>
  const ind: Indentation = {}
  if (node['@_w:left'] !== undefined) ind.left = Number(node['@_w:left'])
  if (node['@_w:right'] !== undefined) ind.right = Number(node['@_w:right'])
  if (node['@_w:firstLine'] !== undefined) ind.firstLine = Number(node['@_w:firstLine'])
  if (node['@_w:hanging'] !== undefined) ind.hanging = Number(node['@_w:hanging'])
  return Object.keys(ind).length > 0 ? ind : undefined
}

function parseRunProperties(rPrNode: unknown): RunProperties {
  if (!rPrNode || typeof rPrNode !== 'object') return {}
  const node = rPrNode as Record<string, unknown>
  const props: RunProperties = {}

  if (node['w:b'] !== undefined) props.bold = parseVal(node['w:b']) === true
  if (node['w:i'] !== undefined) props.italic = parseVal(node['w:i']) === true

  const szNode = node['w:sz']
  if (szNode !== undefined && typeof szNode === 'object' && szNode !== null) {
    props.fontSize = Number((szNode as Record<string, unknown>)['@_w:val'])
  }

  const colorNode = node['w:color']
  if (colorNode !== undefined && typeof colorNode === 'object' && colorNode !== null) {
    props.color = String((colorNode as Record<string, unknown>)['@_w:val'])
  }

  const rFontsNode = node['w:rFonts']
  if (rFontsNode !== undefined && typeof rFontsNode === 'object' && rFontsNode !== null) {
    const fonts = rFontsNode as Record<string, unknown>
    props.fontFamily = String(
      fonts['@_w:ascii'] ||
      fonts['@_w:hAnsi'] ||
      fonts['@_w:cs'] ||
      ''
    )
  }

  const uNode = node['w:u']
  if (uNode !== undefined && typeof uNode === 'object' && uNode !== null) {
    props.underline = String((uNode as Record<string, unknown>)['@_w:val'] || 'single')
  }

  const vertAlignNode = node['w:vertAlign']
  if (vertAlignNode !== undefined && typeof vertAlignNode === 'object' && vertAlignNode !== null) {
    const val = String((vertAlignNode as Record<string, unknown>)['@_w:val'])
    if (val === 'superscript') props.superscript = true
    if (val === 'subscript') props.subscript = true
  }

  if (node['w:smallCaps'] !== undefined) props.smallCaps = parseVal(node['w:smallCaps']) === true
  if (node['w:strike'] !== undefined) props.strikethrough = parseVal(node['w:strike']) === true

  return props
}

function parseParagraphProperties(pPrNode: unknown): ParagraphProperties {
  if (!pPrNode || typeof pPrNode !== 'object') return {}
  const node = pPrNode as Record<string, unknown>
  const props: ParagraphProperties = {}

  const pStyleNode = node['w:pStyle']
  if (pStyleNode !== undefined && typeof pStyleNode === 'object' && pStyleNode !== null) {
    props.styleId = String((pStyleNode as Record<string, unknown>)['@_w:val'])
  }
  const jcNode = node['w:jc']
  if (jcNode !== undefined && typeof jcNode === 'object' && jcNode !== null) {
    props.alignment = String((jcNode as Record<string, unknown>)['@_w:val'])
  }
  if (node['w:spacing'] !== undefined) {
    props.lineSpacing = parseLineSpacing(node['w:spacing'])
  }
  if (node['w:ind'] !== undefined) {
    props.indentation = parseIndentation(node['w:ind'])
  }
  const outlineLvlNode = node['w:outlineLvl']
  if (outlineLvlNode !== undefined && typeof outlineLvlNode === 'object' && outlineLvlNode !== null) {
    props.outlineLevel = Number((outlineLvlNode as Record<string, unknown>)['@_w:val'])
  }
  if (node['w:keepNext'] !== undefined) {
    props.keepNext = parseVal(node['w:keepNext']) === true
  }
  if (node['w:keepLines'] !== undefined) {
    props.keepLines = parseVal(node['w:keepLines']) === true
  }
  if (node['w:pageBreakBefore'] !== undefined) {
    props.pageBreakBefore = parseVal(node['w:pageBreakBefore']) === true
  }

  return props
}

function parseParagraph(pNode: unknown): DocxParagraph {
  if (!pNode || typeof pNode !== 'object') {
    return {
      runs: [],
      properties: {},
      hasPageBreakBefore: false,
      hasPageBreakAfter: false,
      hasImage: false,
      footnoteRefs: []
    }
  }
  const node = pNode as Record<string, unknown>
  const pPr = node['w:pPr']
  const properties = parseParagraphProperties(pPr)

  const runs: DocxRun[] = []
  const footnoteRefs: number[] = []
  let hasPageBreakBefore = properties.pageBreakBefore === true
  let hasImage = false

  // Walk through paragraph contents (w:r, w:hyperlink, w:proofErr, w:fldSimple, etc.)
  // We can recursively traverse the w:p node to extract all runs in document order
  function traverseParagraph(currentNode: unknown) {
    if (!currentNode || typeof currentNode !== 'object') return

    if (Array.isArray(currentNode)) {
      for (const item of currentNode) {
        traverseParagraph(item)
      }
      return
    }

    const obj = currentNode as Record<string, unknown>

    // Process w:r (run)
    const wR = obj['w:r']
    if (wR) {
      const wRs = ensureArray(wR)
      for (const r of wRs) {
        if (!r || typeof r !== 'object') continue
        const rObj = r as Record<string, unknown>
        const rPr = rObj['w:rPr']
        const runProps = parseRunProperties(rPr)

        // Check if run has text
        let text = ''
        const wT = rObj['w:t']
        if (wT !== undefined) {
          const wTs = ensureArray(wT)
          text = wTs.map(t => getText(t)).join('')
        }

        // Check if run contains a break
        const wBr = rObj['w:br']
        if (wBr !== undefined) {
          const brs = ensureArray(wBr)
          for (const br of brs) {
            if (br && typeof br === 'object') {
              const brObj = br as Record<string, unknown>
              if (brObj['@_w:type'] === 'page') {
                hasPageBreakBefore = true
              }
            }
          }
        }

        // Check for images
        if (rObj['w:drawing'] !== undefined || rObj['w:pict'] !== undefined) {
          hasImage = true
        }

        // Check for footnote reference
        let runFootnoteId: number | undefined
        const fnRef = rObj['w:footnoteReference']
        if (fnRef !== undefined && typeof fnRef === 'object' && fnRef !== null) {
          const fnRefObj = fnRef as Record<string, unknown>
          const refId = Number(fnRefObj['@_w:id'])
          if (!isNaN(refId)) {
            footnoteRefs.push(refId)
            runFootnoteId = refId
          }
        }

        if (text || hasImage || wBr !== undefined || runFootnoteId !== undefined) {
          runs.push({
            text,
            properties: runProps,
            footnoteId: runFootnoteId
          })
        }
      }
    }

    // Recurse into other nodes (like w:hyperlink) to extract nested runs
    for (const key of Object.keys(obj)) {
      if (key !== 'w:r' && key !== 'w:pPr' && key !== '@_' && key !== '#text') {
        traverseParagraph(obj[key])
      }
    }
  }

  traverseParagraph(pNode)

  const pPrObj = pPr as Record<string, unknown> | undefined
  const hasPageBreakAfter = pPrObj && pPrObj['w:sectPr'] !== undefined

  return {
    runs,
    properties,
    hasPageBreakBefore,
    hasPageBreakAfter: !!hasPageBreakAfter,
    hasImage,
    footnoteRefs
  }
}

function parseStyles(stylesObj: unknown): {
  styles: Map<string, DocxStyle>;
  defaultRunProperties?: RunProperties;
  defaultParagraphProperties?: ParagraphProperties;
} {
  const stylesMap = new Map<string, DocxStyle>()
  let defaultRunProperties: RunProperties | undefined
  let defaultParagraphProperties: ParagraphProperties | undefined

  if (!stylesObj || typeof stylesObj !== 'object') {
    return { styles: stylesMap }
  }

  const rootObj = stylesObj as Record<string, unknown>
  const stylesRoot = rootObj['w:styles']
  if (!stylesRoot || typeof stylesRoot !== 'object') {
    return { styles: stylesMap }
  }

  const stylesRootObj = stylesRoot as Record<string, unknown>

  // 1. Parse docDefaults
  const docDefaults = stylesRootObj['w:docDefaults']
  if (docDefaults && typeof docDefaults === 'object') {
    const defaultsObj = docDefaults as Record<string, unknown>
    const rPrDefault = defaultsObj['w:rPrDefault']
    if (rPrDefault && typeof rPrDefault === 'object') {
      const rPrDefaultObj = rPrDefault as Record<string, unknown>
      if (rPrDefaultObj['w:rPr']) {
        defaultRunProperties = parseRunProperties(rPrDefaultObj['w:rPr'])
      }
    }
    const pPrDefault = defaultsObj['w:pPrDefault']
    if (pPrDefault && typeof pPrDefault === 'object') {
      const pPrDefaultObj = pPrDefault as Record<string, unknown>
      if (pPrDefaultObj['w:pPr']) {
        defaultParagraphProperties = parseParagraphProperties(pPrDefaultObj['w:pPr'])
      }
    }
  }

  // 2. Parse individual styles
  const styleNode = stylesRootObj['w:style']
  if (styleNode) {
    const stylesList = ensureArray(styleNode)
    for (const styleNodeItem of stylesList) {
      if (!styleNodeItem || typeof styleNodeItem !== 'object') continue
      const styleObj = styleNodeItem as Record<string, unknown>
      const styleId = String(styleObj['@_w:styleId'])
      
      const wName = styleObj['w:name']
      let name = ''
      if (wName && typeof wName === 'object') {
        name = String((wName as Record<string, unknown>)['@_w:val'])
      }

      const type = String(styleObj['@_w:type'] || 'paragraph')

      const wBasedOn = styleObj['w:basedOn']
      let basedOn: string | undefined
      if (wBasedOn && typeof wBasedOn === 'object') {
        basedOn = String((wBasedOn as Record<string, unknown>)['@_w:val'])
      }

      const runProperties = parseRunProperties(styleObj['w:rPr'])
      const paragraphProperties = parseParagraphProperties(styleObj['w:pPr'])

      stylesMap.set(styleId, {
        styleId,
        name,
        type,
        basedOn,
        runProperties,
        paragraphProperties
      })
    }
  }

  return {
    styles: stylesMap,
    defaultRunProperties,
    defaultParagraphProperties
  }
}

export async function parseDocx(filePath: string): Promise<ParsedDocument> {
  const fileBuffer = fs.readFileSync(filePath)
  const zip = await JSZip.loadAsync(fileBuffer)

  const docXmlFile = zip.file('word/document.xml')
  if (!docXmlFile) {
    throw new Error('Invalid DOCX file: missing word/document.xml')
  }

  const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
    allowBooleanAttributes: true,
    trimValues: false
  })

  const docXmlText = await docXmlFile.async('text')
  const docObj = xmlParser.parse(docXmlText) as unknown
  if (!docObj || typeof docObj !== 'object') {
    throw new Error('Invalid DOCX structure in word/document.xml')
  }
  const docObjRecord = docObj as Record<string, unknown>
  const wDocument = docObjRecord['w:document']
  if (!wDocument || typeof wDocument !== 'object') {
    throw new Error('Invalid DOCX structure: missing w:document in word/document.xml')
  }
  const wDocumentRecord = wDocument as Record<string, unknown>
  const body = wDocumentRecord['w:body']
  if (!body) {
    throw new Error('Invalid DOCX structure: missing w:body in word/document.xml')
  }

  // Parse styles.xml if present
  const stylesXmlFile = zip.file('word/styles.xml')
  let stylesMap = new Map<string, DocxStyle>()
  let defaultRunProperties: RunProperties | undefined
  let defaultParagraphProperties: ParagraphProperties | undefined

  if (stylesXmlFile) {
    const stylesXmlText = await stylesXmlFile.async('text')
    const stylesObj = xmlParser.parse(stylesXmlText)
    const parsedStyles = parseStyles(stylesObj)
    stylesMap = parsedStyles.styles
    defaultRunProperties = parsedStyles.defaultRunProperties
    defaultParagraphProperties = parsedStyles.defaultParagraphProperties
  }

  // Parse footnotes.xml if present
  const footnotesXmlFile = zip.file('word/footnotes.xml')
  const footnotes: DocxFootnote[] = []

  if (footnotesXmlFile) {
    const footnotesXmlText = await footnotesXmlFile.async('text')
    const footnotesObj = xmlParser.parse(footnotesXmlText) as unknown
    if (footnotesObj && typeof footnotesObj === 'object') {
      const footnotesObjRecord = footnotesObj as Record<string, unknown>
      const wFootnotes = footnotesObjRecord['w:footnotes']
      if (wFootnotes && typeof wFootnotes === 'object') {
        const wFootnotesRecord = wFootnotes as Record<string, unknown>
        const wFootnote = wFootnotesRecord['w:footnote']
        if (wFootnote) {
          const fnList = ensureArray(wFootnote)
          for (const fnNode of fnList) {
            if (!fnNode || typeof fnNode !== 'object') continue
            const fnNodeRecord = fnNode as Record<string, unknown>
            const id = Number(fnNodeRecord['@_w:id'])
            // Ignore separator and continuationSeparator footnotes (usually negative IDs)
            if (!isNaN(id) && id >= 0) {
              const fnParas: DocxParagraph[] = []
              const wP = fnNodeRecord['w:p']
              if (wP) {
                const wPs = ensureArray(wP)
                for (const wp of wPs) {
                  fnParas.push(parseParagraph(wp))
                }
              }
              footnotes.push({
                id,
                paragraphs: fnParas
              })
            }
          }
        }
      }
    }
  }

  // Collect all paragraphs in document.xml w:body recursively
  const paragraphs: DocxParagraph[] = []

  function collectAllParagraphs(node: unknown) {
    if (!node || typeof node !== 'object') return

    if (Array.isArray(node)) {
      for (const item of node) {
        collectAllParagraphs(item)
      }
      return
    }

    const obj = node as Record<string, unknown>
    const wP = obj['w:p']
    if (wP) {
      const wPs = ensureArray(wP)
      for (const wp of wPs) {
        paragraphs.push(parseParagraph(wp))
      }
    }

    // Recurse into all other keys except w:p to find tables and other structures in order
    for (const key of Object.keys(obj)) {
      if (key !== 'w:p' && key !== '@_' && key !== '#text') {
        collectAllParagraphs(obj[key])
      }
    }
  }

  collectAllParagraphs(body)

  // Check if any header or footer XML files exist in the zip
  const hasHeaderOrFooter = zip.file(/^word\/(header|footer)\d*\.xml$/).length > 0

  return {
    paragraphs,
    footnotes,
    styles: stylesMap,
    defaultRunProperties,
    defaultParagraphProperties,
    hasHeaderOrFooter
  }
}
