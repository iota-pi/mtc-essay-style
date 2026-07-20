import { describe, it, expect } from "vitest"
import { createTestParagraph, createTestDocument, createTestContext } from "./test-utils"
import { DocumentSections } from "../src/analysis/sections"
import { whitespaceBeforePunctuationRule } from "../src/rules/definitions/whitespace-before-punctuation"

describe("Whitespace Before Punctuation Rule", () => {
  it("should pass when there is no whitespace before punctuation", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("This is a normal sentence, and it has proper spacing. Why? Because it's correct! Look: a colon.")
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
    const violations = whitespaceBeforePunctuationRule.check(context)
    expect(violations.length).toBe(0)
  })

  it("should flag whitespace before various punctuation marks in body text", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("Incorrect spacing , here and there . Why ? Oh ! Look here : and here ; too.")
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
    const violations = whitespaceBeforePunctuationRule.check(context)
    
    expect(violations.length).toBe(6)
    
    // Check comma
    expect(violations[0].correction?.found).toBe(" ,")
    expect(violations[0].correction?.expected).toBe(",")
    
    // Check period
    expect(violations[1].correction?.found).toBe(" .")
    expect(violations[1].correction?.expected).toBe(".")
    
    // Check question mark
    expect(violations[2].correction?.found).toBe(" ?")
    expect(violations[2].correction?.expected).toBe("?")
    
    // Check exclamation mark
    expect(violations[3].correction?.found).toBe(" !")
    expect(violations[3].correction?.expected).toBe("!")
    
    // Check colon
    expect(violations[4].correction?.found).toBe(" :")
    expect(violations[4].correction?.expected).toBe(":")
    
    // Check semicolon
    expect(violations[5].correction?.found).toBe(" ;")
    expect(violations[5].correction?.expected).toBe(";")
  })

  it("should flag whitespace before punctuation in footnotes and bibliography", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("Smith, John . *My Book* . Boston : Hendrickson , 1990.")
      ],
      footnotes: [
        {
          id: 1,
          paragraphs: [createTestParagraph("Ibid . , 12 .")]
        }
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
    const violations = whitespaceBeforePunctuationRule.check(context)

    // Should flag:
    // In bibliography: "John ." (1), "*My Book* ." (2), "Boston :" (3), "Hendrickson ," (4)
    // In footnotes: "Ibid ." (5), " ," (6), "12 ." (7)
    expect(violations.length).toBe(7)
    
    // Verify footnote violations
    const footnoteViols = violations.filter(v => v.region === "footnote")
    expect(footnoteViols.length).toBe(3)
  })

  it("should ignore whitespace before ellipses", () => {
    const doc = createTestDocument({
      paragraphs: [
        createTestParagraph("This has an ellipsis ... and another one … which are fine.")
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
    const violations = whitespaceBeforePunctuationRule.check(context)
    expect(violations.length).toBe(0)
  })
})
