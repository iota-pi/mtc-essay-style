import { describe, it, expect } from "vitest"
import { createTestParagraph, createTestDocument, createTestContext } from "./test-utils"
import { DocumentSections } from "../src/analysis/sections"
import { multipleWhitespacesRule } from "../src/rules/definitions/multiple-whitespaces"

describe("Multiple Consecutive Whitespaces Rule", () => {
  it("should pass when there are only single spaces", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("This is a clean sentence. There are no double spaces.")
      ]
    })
    const sections: DocumentSections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    }
    const context = createTestContext(doc, sections)
    const violations = multipleWhitespacesRule.check(context)
    expect(violations.length).toBe(0)
  })

  it("should flag double spaces in the body", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("This  has  multiple double spaces.")
      ]
    })
    const sections: DocumentSections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    }
    const context = createTestContext(doc, sections)
    const violations = multipleWhitespacesRule.check(context)
    expect(violations.length).toBe(2)
    expect(violations[0].severity).toBe("warning")
    expect(violations[0].message).toBe("Multiple consecutive whitespaces detected.")
    expect(violations[0].correction?.found).toBe("  ")
    expect(violations[0].correction?.expected).toBe(" ")
    expect(violations[0].region).toBe("body")
  })

  it("should flag spaces + tabs or multiple tabs", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("Here is a tab\t\tand space  \tcombination.")
      ]
    })
    const sections: DocumentSections = {
      titlePage: [],
      body: doc.paragraphs,
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    }
    const context = createTestContext(doc, sections)
    const violations = multipleWhitespacesRule.check(context)
    expect(violations.length).toBe(2)
    expect(violations[0].correction?.found).toBe("\t\t")
    expect(violations[1].correction?.found).toBe("  \t")
  })

  it("should flag double spaces in footnotes", () => {
    const doc = createTestDocument({
      paragraphs: [],
      footnotes: [
        {
          id: 1,
          paragraphs: [
            createTestParagraph("Footnote  with double spaces.")
          ]
        }
      ]
    })
    const sections: DocumentSections = {
      titlePage: [],
      body: [],
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    }
    const context = createTestContext(doc, sections)
    const violations = multipleWhitespacesRule.check(context)
    expect(violations.length).toBe(1)
    expect(violations[0].severity).toBe("warning")
    expect(violations[0].detail).toContain("Footnote ID: 1")
  })

  it("should flag double spaces in the bibliography", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("Bibliography entry with  double spaces.")
      ]
    })
    const sections: DocumentSections = {
      titlePage: [],
      body: [],
      bibliography: doc.paragraphs,
      hasTitlePage: false,
      hasBibliography: true
    }
    const context = createTestContext(doc, sections)
    const violations = multipleWhitespacesRule.check(context)
    expect(violations.length).toBe(1)
    expect(violations[0].region).toBe("bibliography")
  })

  it("should ignore double spaces in the title page", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("Title  Page  Double  Spaces")
      ]
    })
    const sections: DocumentSections = {
      titlePage: doc.paragraphs,
      body: [],
      bibliography: [],
      hasTitlePage: true,
      hasBibliography: false
    }
    const context = createTestContext(doc, sections)
    const violations = multipleWhitespacesRule.check(context)
    expect(violations.length).toBe(0)
  })
})
