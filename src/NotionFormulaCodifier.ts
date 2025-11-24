/* eslint-disable no-case-declarations */
import { esLintFormat } from './helpers/helpers';
import { ReverseTree } from './helpers/reverseTree';
import { Node } from './helpers/node';
import { lowerCamel, typeMap } from './helpers/utils';
import { CodifyProperty, NodeType } from './model';
import { Logger } from './helpers/logger';

const HAS_CALLBACK = ['map', 'filter', 'find', 'findIndex', 'some', 'every'];
const ADD_VALUE_TYPES = ['number'];

export class NotionFormulaCodifier {
  constructor(
    private formula: string,
    private properties: Record<string, CodifyProperty>
  ) {}

  wrapperFunctions = new Map<string, string>();

  private replaceArithmeticUsage(
    toFind: string,
    wrappers: [string, string][]
  ): void {
    Logger.debug('debugging for var', toFind);
    const escaped = toFind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(
      `(\\+|\\-|\\*|/)?\\s*(this\\.${escaped})\\s*(\\+|\\-|\\*|/)?`,
      'g'
    );
    const execReplace = (str: string) =>
      str.replace(regex, (_, beforeOp, variable, afterOp) => {
        let result = variable + '.value';
        if (beforeOp) result = beforeOp + ' ' + result;
        if (afterOp) result = result + ' ' + afterOp;
        return result;
      });
    wrappers.forEach((wrapper) => (wrapper[1] = execReplace(wrapper[1])));
    execReplace(this.formula);
  }

  private reduceWrappers(): [string, string][] {
    // this is expensive, and could definitely be tuned, but IMO worth it to not have weirdly named functions
    // I just don't think I care enough to make it much faster because I don't think we'll ever have a case
    // where this many O(n)ish operations actually matters based on formula size

    let wrappers: [string, string][];
    let toReplace: [string, string][];
    let replacedFns: [string, string][] = []; // keep track of all fns we replace over time

    // check if we have duplicated wrapper logic
    do {
      toReplace = [];
      wrappers = [];
      for (const entry of this.wrapperFunctions) {
        const existingWrapper = wrappers.find((wrapper) => {
          return wrapper[1] === entry[1];
        });

        if (existingWrapper) {
          toReplace.push([entry[0], existingWrapper[0]]);
        } else {
          wrappers.push(entry);
        }
      }
      toReplace.forEach((replace) => {
        wrappers.forEach((wrapper) => {
          wrapper[1] = wrapper[1].replace(`${replace[0]}()`, `${replace[1]}()`);
        });
      });
      this.wrapperFunctions = new Map(wrappers);
      replacedFns = replacedFns.concat(toReplace);
    } while (toReplace.length);

    wrappers.sort((a, b) => (a[0] > b[0] ? -1 : 1));

    replacedFns.forEach((replace) => {
      this.formula = this.formula.replace(`${replace[0]}()`, `${replace[1]}()`);
    });

    Logger.debug('replaced fns: ', replacedFns);

    replacedFns = [];
    wrappers.forEach((wrapper, index) => {
      if (wrapper[0].at(-1) !== (wrappers.length - index).toString()) {
        const orig = wrapper[0];
        wrapper[0] = wrapper[0].slice(0, -1) + (wrappers.length - index);
        replacedFns.push([orig, wrapper[0]]);
        for (let j = index + 1; j < wrappers.length; j++) {
          wrappers[j][1] = wrappers[j][1].replace(
            `${orig}()`,
            `${wrapper[0]}()`
          );
        }
      }
    });
    Logger.debug('replacedFns', replacedFns);
    replacedFns.forEach((replace) => {
      this.formula = this.formula.replace(`${replace[0]}()`, `${replace[1]}()`);
    });

    return wrappers;
  }

  getFormula(properties: Record<string, string>[]): Promise<string> {
    const wrappers = this.reduceWrappers();
    properties.forEach(
      (property) => (property.name = lowerCamel(property.name))
    );
    properties.forEach(
      (property) =>
        ADD_VALUE_TYPES.includes(property.type) &&
        this.replaceArithmeticUsage(property.name, wrappers)
    );

    const rawFormula = `
      import { NotionFormulaGenerator } from './src/NotionFormulaGenerator';
      import * as Model from './src/model';
      class MyFirstFormula extends NotionFormulaGenerator {
          ${properties.reduce(
            (prev, property) =>
              prev +
              `public ${lowerCamel(property.name)} = new Model.${typeMap(
                property.type
              )}('${property.name}');\n`,
            ''
          )}

          formula() {
            ${
              (this.formula.startsWith('return') ||
              this.formula.startsWith('if')
                ? ''
                : 'return ') + this.formula
            }
          }

          ${wrappers.reduce(
            (prev, [name, content]) => prev + `${name}() {${content}}\n\n`,
            ''
          )}

          public buildFunctionMap(): Map<string, string> {
              return new Map([${wrappers.reduce(
                (prev, [name]) =>
                  prev + `\n['${name}', this.${name}.toString()],`,
                ''
              )}]);
          }
      }`;

    return esLintFormat(rawFormula);
  }

  wrapLogic(node: Node, currentFormula: string) {
    let innerFormula = '';
    if (node.type === NodeType.Wrapper) {
      node.wrappedChildren.forEach((child) => {
        innerFormula += this.build(child, innerFormula);
      });
    } else {
      innerFormula += this.build(node, innerFormula);
    }

    this.wrapperFunctions.set(
      'func' + (this.wrapperFunctions.size + 1),
      innerFormula.startsWith('if') ? innerFormula : 'return ' + innerFormula
    );

    Logger.debug('creating wrapper logic for: ', node.statement);
    const sliceParentheses = (str: string) => {
      let i = str.length - 1;
      while (str[i] === ')') {
        i--;
      }
      return str.slice(0, i + 1);
    };

    const slicedStatement = sliceParentheses(node.statement);

    currentFormula += `${
      currentFormula.endsWith('{') ? 'return ' : ''
    } ${slicedStatement}this.func${this.wrapperFunctions.size}()${new Array(
      slicedStatement.split('(').length - 1
    )
      .fill(')')
      .join('')}`;

    Logger.debug('returning wrappers: ', this.wrapperFunctions);
    return currentFormula;
  }

  build(node: Node, currentFormula = ''): string {
    switch (node?.type) {
      case NodeType.Logic:
        const logicStatement =
          node.logicChild.type === NodeType.Logic
            ? this.wrapLogic(node.logicChild, currentFormula)
            : this.build(node.logicChild, currentFormula);
        currentFormula = 'if (' + logicStatement + ') { return ';
        currentFormula =
          this.build(node.trueChild, currentFormula) + '} else { return ';
        currentFormula = this.build(node.falseChild, currentFormula);
        currentFormula += '}';
        break;
      case NodeType.Return:
        currentFormula += node.statement;
        break;
      case NodeType.Wrapper:
        currentFormula = this.wrapLogic(node, currentFormula);
        break;
      case NodeType.Combination:
        node.wrappedChildren.forEach((child) => {
          currentFormula = this.build(child, currentFormula);
        });
    }
    return currentFormula;
  }

  findClosingParen(str: string, start: number): number {
    let depth = 1;
    for (let i = start; i < str.length; i++) {
      if (str[i] === '(') depth++;
      else if (str[i] === ')') depth--;
      if (depth === 0) return i;
    }
    throw new Error('Unbalanced parentheses');
  }

  splitTopLevel(str: string): string[] {
    const parts = [];
    let depth = 0;
    let current = '';

    for (const char of str) {
      if (char === '(') depth++;
      if (char === ')') depth--;
      if (char === ',' && depth === 0) {
        parts.push(current);
        current = '';
        continue;
      }
      current += char;
    }

    parts.push(current);
    return parts;
  }

  execReplace(): string {
    this.formula = this.formula
      .replace(
        /[pP]rop\("(.*?)"\)/g,
        (match, propName) => `this.${lowerCamel(propName)}`
      )
      .replace(
        /(?<!\.)(?<!this\.)\b(?!if\b)([a-zA-Z_][a-zA-Z0-9_]*)\(/g,
        (match, word) => `this.${word}(`
      );
    const toDelete: string[] = [];
    const toSwitch: [string, string][] = [];

    this.formula = this.formula.replace(
      new RegExp(`(\\.?)(${HAS_CALLBACK.join('|')})\\(`, 'g'),
      (match, dot, method, offset) => {
        const start = offset + match.length; // position after "("
        const end = this.findClosingParen(this.formula, start);
        const argsString = this.formula.slice(start, end);

        const args = this.splitTopLevel(argsString);

        const last = args[args.length - 1].trim();
        const transformed = `(index, current) => ${last}`;

        args[args.length - 1] = transformed;
        toDelete.push(argsString);
        if (args.length === 2) {
          toSwitch.push(['this' + match + args[0] + ', ', args[0] + match]);
        }
        return `${dot}${method}(` + args.join(', ');
      }
    );
    toSwitch.forEach(([orig, replacement]) => {
      const regex = new RegExp(
        orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'g'
      );
      this.formula = this.formula.replace(regex, replacement);
    });
    // we can't accurately replace in the above fn because we don't search for the regex on the closed parantheses
    toDelete.forEach((orig) => {
      const regex = new RegExp(
        orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'g'
      );
      let match: RegExpExecArray | null;
      let lastIndex = -1;
      while ((match = regex.exec(this.formula))) {
        lastIndex = Math.max(lastIndex, match.index);
      }
      if (lastIndex !== -1) {
        this.formula =
          this.formula.slice(0, lastIndex) +
          this.formula.slice(lastIndex + orig.length);
      }
    });

    return this.formula;
  }

  async decompile(): Promise<string> {
    const propertyVals = Object.keys(this.properties).map(
      (p) => this.properties[p]
    ) as Record<string, string>[];
    this.execReplace();
    if (this.formula.charAt(0) === '(') {
      this.formula = this.formula.substring(1, this.formula.length - 1);
    }
    const tree = new ReverseTree(this.formula);
    this.formula = this.build(tree.root);
    const result = await this.getFormula(propertyVals);
    return result;
  }
}
