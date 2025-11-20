/* eslint-disable no-case-declarations */
import { esLintFormat } from './helpers/helpers';
import { ReverseTree } from './helpers/reverseTree';
import { Node } from './helpers/node';
import { lowerCamel, typeMap } from './helpers/utils';
import { NodeType } from './model';

export interface CodifyProperty {
  name: string;
  type: string;
  [key: string]: any;
}

const HAS_CALLBACK = ['map', 'filter', 'find', 'findIndex', 'some', 'every'];

export class NotionFormulaCodifier {
  constructor(
    private formula: string,
    private properties: Record<string, CodifyProperty>
  ) {}

  getFormula = (
    formula: string,
    properties: Record<string, string>[],
    wrappers: [string, string][]
  ): Promise<string> =>
    esLintFormat(`
      import { NotionFormulaGenerator } from './src/NotionFormulaGenerator';
      import * as Model from './src/model';
      class MyFirstFormula extends NotionFormulaGenerator {
          ${properties.reduce(
            (prev, property) =>
              `public ${property.name} = new Model.${typeMap(property.type)}('${
                property.name
              }');\n`,
            ''
          )}

          formula() {
            ${
              (formula.startsWith('return') || formula.startsWith('if')
                ? ''
                : 'return ') + formula
            }
          }

          ${wrappers.reduce(
            (prev, [name, content]) => prev + `${name}() {${content}}\n`,
            ''
          )}

          public buildFunctionMap(): Map<string, string> {
              return new Map([${wrappers.reduce(
                (prev, [name]) =>
                  prev + `\n['${name}', this.${name}.toString()],\n`,
                ''
              )}]);
          }
      }`);

  wrapLogic(node: Node, wrappers: [string, string][], currentFormula: string) {
    const innerWrappers: [string, string][] = [];
    let innerFormula = '';
    if (node.type === NodeType.Wrapper) {
      node.wrappedChildren.forEach((child) => {
        innerFormula += this.build(child, innerWrappers, innerFormula);
      });
    } else {
      innerFormula += this.build(node, innerWrappers, innerFormula);
    }

    wrappers.push([
      'func' + (wrappers.length + innerWrappers.length + 1),
      innerFormula.startsWith('if') ? innerFormula : 'return ' + innerFormula,
    ]);
    innerWrappers.forEach((iw) => wrappers.push(iw));

    currentFormula += `${
      currentFormula.endsWith('{') ? 'return ' : ''
    } ${node.statement.slice(0, -1)}this.func${wrappers.length}()${
      node.tail +
      new Array(node.statement.split('(').length - 1).fill(')').join('')
    }`;
    return currentFormula;
  }

  build(node: Node, wrappers: [string, string][], currentFormula = ''): string {
    switch (node?.type) {
      case NodeType.Logic:
        let logicStatement =
          node.logicChild.type === NodeType.Logic
            ? this.wrapLogic(node.logicChild, wrappers, currentFormula)
            : this.build(node.logicChild, wrappers, currentFormula);
        currentFormula = 'if (' + logicStatement + ') { return ';
        currentFormula =
          this.build(node.trueChild, wrappers, currentFormula) +
          '} else { return ';
        currentFormula = this.build(node.falseChild, wrappers, currentFormula);
        currentFormula += '}';
        break;
      case NodeType.Return:
        currentFormula += node.statement;
        break;
      case NodeType.Wrapper:
        currentFormula = this.wrapLogic(node, wrappers, currentFormula);
        break;
      case NodeType.Combination:
        currentFormula += node.nose;
        node.wrappedChildren.forEach((child) => {
          currentFormula = this.build(child, wrappers, currentFormula);
        });
    }
    return currentFormula;
  }

  transformCallback(callback: string): string {
    return callback;
  }

  findClosingParen(str: string, start: number): number {
    let depth = 1;
    for (let i = start; i < str.length; i++) {
      if (str[i] === '(') depth++;
      if (str[i] === ')') depth--;
      if (depth === 0) return i;
    }
    throw new Error('Unbalanced parentheses');
  }

  splitTopLevel(str: string): string[] {
    let parts = [];
    let depth = 0;
    let current = '';

    for (let char of str) {
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
    // replace references to database properties
    const wrappers: [string, string][] = [];
    this.formula = this.build(tree.root, wrappers);
    const result = await this.getFormula(this.formula, propertyVals, wrappers);
    return result;
  }
}
