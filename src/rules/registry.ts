import { StyleRule, RuleScope } from './types'

export class RuleRegistry {
  private rules = new Map<string, StyleRule>()

  public register(rule: StyleRule): void {
    this.rules.set(rule.id, rule)
  }

  public registerAll(rules: StyleRule[]): void {
    for (const rule of rules) {
      this.register(rule)
    }
  }

  public getAll(): StyleRule[] {
    return Array.from(this.rules.values())
  }

  public getByScope(scope: RuleScope): StyleRule[] {
    return this.getAll().filter(rule => rule.scope.includes(scope))
  }

  public getById(id: string): StyleRule | undefined {
    return this.rules.get(id)
  }
}
