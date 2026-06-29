import { describe, it, expect } from "vitest";
import { runChecks } from "../src/rules/runner";
import { RuleRegistry } from "../src/rules/registry";
import { ParsedDocument, DocxParagraph } from "../src/docx/types";
import { DocumentSections } from "../src/analysis/sections";
import { StyleRule } from "../src/rules/types";

function createParagraph(text: string): DocxParagraph {
  return {
    runs: [{ text, properties: {} }],
    properties: {},
    hasPageBreakBefore: false,
    hasImage: false,
    footnoteRefs: []
  };
}

describe("Rule Runner", () => {
  it("should warn if no bibliography is present", () => {
    const doc: ParsedDocument = {
      paragraphs: [createParagraph("Body text")],
      footnotes: [],
      styles: new Map()
    };

    const sections: DocumentSections = {
      titlePage: [],
      body: [createParagraph("Body text")],
      bibliography: [],
      hasTitlePage: false,
      hasBibliography: false
    };

    const registry = new RuleRegistry();
    const result = runChecks(doc, sections, registry);

    expect(result.rulesRun).toBe(0);
    expect(result.violations.length).toBe(1);
    expect(result.violations[0].ruleId).toBe("builtin-bibliography-check");
    expect(result.violations[0].severity).toBe("warning");
  });

  it("should run registered rules and collect violations", () => {
    const doc: ParsedDocument = {
      paragraphs: [createParagraph("Test text")],
      footnotes: [],
      styles: new Map()
    };

    const sections: DocumentSections = {
      titlePage: [],
      body: [createParagraph("Test text")],
      bibliography: [createParagraph("References")],
      hasTitlePage: false,
      hasBibliography: true
    };

    const mockRule: StyleRule = {
      id: "mock-rule",
      name: "Mock Rule",
      description: "A test rule",
      scope: ["body"],
      check: (ctx) => {
        return [
          {
            ruleId: "mock-rule",
            ruleName: "Mock Rule",
            severity: "error",
            message: "Violation in mock rule."
          }
        ];
      }
    };

    const registry = new RuleRegistry();
    registry.register(mockRule);

    const result = runChecks(doc, sections, registry);
    expect(result.rulesRun).toBe(1);
    expect(result.violations.length).toBe(1);
    expect(result.violations[0].ruleId).toBe("mock-rule");
    expect(result.violations[0].severity).toBe("error");
    expect(result.violations[0].message).toBe("Violation in mock rule.");
  });
});
