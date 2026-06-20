import { RuleRegistry } from "./registry.js";

// Currently no style rules are defined as per the requirements.
// Rules can be added to the src/rules/definitions/ folder and imported/registered here.
export const defaultRegistry = new RuleRegistry();

export { RuleRegistry } from "./registry.js";
export { runChecks } from "./runner.js";
export type { StyleRule, StyleViolation, RuleContext, RuleScope, Severity } from "./types.js";
export type { CheckResult } from "./runner.js";
