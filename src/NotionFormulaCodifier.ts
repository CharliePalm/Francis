/* eslint-disable no-case-declarations */
import { esLintFormat, isAlphaNumericOrWhitespace } from './helpers/helpers';
import { ReverseTree } from './helpers/reverseTree';
import { Node } from './helpers/node';
import { lowerCamel, typeMap } from './helpers/utils';
import { CodifyProperty, NodeType } from './model';
import { Logger } from './helpers/logger';
import { DepthTracker } from './helpers/depthTracker';

const HAS_CALLBACK = ['map', 'filter', 'find', 'findIndex', 'some', 'every'];
const ADD_VALUE_TYPES = ['number'];

interface Edit {
  start: number;
  end: number;
  replacement: string;
  consumeClosingParen?: boolean;
}

export class NotionFormulaCodifier {
  constructor(
    private formula: string,
    private properties: Record<string, CodifyProperty>
  ) {}

  private wrapperFunctions = new Map<string, string>();

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

  private getFormula(properties: Record<string, string>[]): Promise<string> {
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
      }`.replace(/\_valueAccessor\(/g, '_valueAccessor<any>(');
    console.log('final formula: ', rawFormula);
    return esLintFormat(rawFormula);
  }

  private wrapLogic(node: Node, currentFormula: string) {
    console.log('Wrapping logic for node: ', node);
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

    Logger.debug('returning from wrapLogic:', {
      wrapperFunctions: this.wrapperFunctions,
      currentFormula,
    });
    return currentFormula;
  }

  private build(node: Node, currentFormula = ''): string {
    switch (node?.type) {
      case NodeType.Logic:
        console.log('logic node: ', node.logicChild);
        console.log('true child: ', node.trueChild);
        console.log('false child: ', node.falseChild);
        if (
          (!node.trueChild || !node.falseChild) &&
          !node.wrappedChildren?.length
        ) {
          throw new Error('Missing true or false child in logic node');
        }

        if (node.logicChild.type === NodeType.Combination) {
          if (node.logicChild.children.length === 1) {
            console.log(
              'narrowing combination to single child: ',
              node.logicChild.children[0]
            );
            node.logicChild = node.logicChild.children[0];
          }
        }
        const logicStatement =
          node.logicChild.type === NodeType.Logic
            ? this.wrapLogic(node.logicChild, currentFormula)
            : this.build(node.logicChild);
        currentFormula = 'if (' + logicStatement + ') { return ';
        console.log('logic statement: ', logicStatement);
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

  private findClosingParen(str: string, start: number): number {
    let depth = 1;
    for (let i = start; i < str.length; i++) {
      if (str[i] === '(') depth++;
      else if (str[i] === ')') depth--;
      if (depth === 0) return i;
    }
    throw new Error('Unbalanced parentheses');
  }

  private splitTopLevel(str: string): string[] {
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

  private execReplace(): string {
    console.log('starting:\n' + this.formula);
    this.formula = this.formula.replace(
      /(?<!\.)(?<!this\.)\b(?!if\b)([a-zA-Z_][a-zA-Z0-9_]*)\(/g,
      (_, word) => `this.${word}(`
    );
    console.log(this.formula);
    const tracker = new DepthTracker(this.formula);
    let str: string = '';
    while (tracker.inc()) {
      str += tracker.currChar;
      if (tracker.inQuote) {
        continue;
      }

      if (tracker.substr(-3, 4) === ' or ') {
        // replace or -> ||
        console.log('tracker.substr(-4, 4):', tracker.substr(-4, 4));
        str = str.slice(0, -4) + ' || ';
      } else if (tracker.substr(-4, 5) === ' and ') {
        // replace and -> &&
        console.log('tracker.substr(-5, 5):', tracker.substr(-5, 5));
        str = str.slice(0, -5) + ' && ';
      } else if (
        tracker.substr(0, 3) === 'not' &&
        isAlphaNumericOrWhitespace(tracker.prevChar || ' ') &&
        isAlphaNumericOrWhitespace(tracker.relativeCharAt(3))
      ) {
        // replace not -> this.not
        console.log('tracker.substr(-3, 3):', tracker.substr(0, 3));
        str = str.slice(0, -1) + 'this.n';
      } else if (tracker.nextChar === '(') {
        // this ensures that function calls contain no white space from identifier -> parenthese
        str = str.trim();
      } else if (tracker.substr(0, 4)?.toLowerCase() === 'prop') {
        // adds 'this.' to the beginning of the DB's properties, and uses the value accessor for properties of other objects
        const isValueAccessor =
          tracker.substr(-8, 7) === 'current' || tracker.substr(-2) === ').';
        console.log(
          `isValueAccessor: ${
            tracker.substr(-8, 7) === 'current' || tracker.substr(-2) === ').'
          }`
        );
        const name = this.getPropName(tracker);
        if (isValueAccessor) {
          str = str.slice(0, -1) + `_valueAccessor("${name}"`;
        } else {
          str = str.slice(0, -1) + `${lowerCamel(name)}`;
          tracker.inc(); // Move past closing parenthesis
        }
      }
    }
    this.formula = str;
    console.log(this.formula);
    const edits: Edit[] = [];
    const callbackPattern = new RegExp(
      `(\\.?)(${HAS_CALLBACK.join('|')})\\(`,
      'g'
    );

    let match: RegExpExecArray | null;
    while ((match = callbackPattern.exec(this.formula)) !== null) {
      this.replaceCallbackFunctions(match, edits);
    }

    // Apply right-to-left so earlier offsets stay valid
    edits.sort((a, b) => b.start - a.start);

    for (const { start, end, replacement, consumeClosingParen } of edits) {
      this.formula =
        this.formula.slice(0, start) +
        replacement +
        this.formula.slice(consumeClosingParen ? end + 1 : end);
    }
    console.log('finshed:\n' + this.formula);
    return this.formula;
  }

  private replaceCallbackFunctions(
    match: RegExpExecArray,
    edits: Edit[]
  ): void {
    const [fullMatch, dot, method] = match;
    const offset = match.index;
    const argsStart = offset + fullMatch.length;
    const argsEnd = this.findClosingParen(this.formula, argsStart);
    const argsString = this.formula.slice(argsStart, argsEnd);
    console.log({ offset, argsString, argsStart, argsEnd });
    const args = this.splitTopLevel(argsString);
    const last = args[args.length - 1].trim();
    args[args.length - 1] = `(index, current) => ${last}`;

    if (args.length === 2) {
      const beforeMatch = this.formula.slice(0, offset);
      let ownerStart = offset;
      if (dot === '.') {
        const identMatch = beforeMatch.match(/[a-zA-Z_][a-zA-Z0-9_.]*$/);
        if (identMatch) {
          ownerStart = offset - identMatch[0].length;
        }
      }
      const newCall = `${args[0].trim()}${dot}${method}(${args[1]})`;
      edits.push({
        start: ownerStart,
        end: argsEnd,
        replacement: newCall,
        consumeClosingParen: true,
      });
    } else {
      edits.push({
        start: argsStart,
        end: argsEnd,
        replacement: args.join(', '),
      });
    }
  }

  private getPropName(tracker: DepthTracker): string {
    // increment to the next quote:
    while (!tracker.inQuote) {
      tracker.inc();
    }
    // move past the quote char
    tracker.inc();
    let toRet = '';
    while (tracker.inQuote) {
      toRet += tracker.currChar;
      tracker.inc();
    }
    return toRet;
  }
  async decompile(): Promise<string> {
    const propertyVals = Object.keys(this.properties).map(
      (p) => this.properties[p]
    ) as Record<string, string>[];
    // this.execReplace();
    if (this.formula.charAt(0) === '(') {
      this.formula = this.formula.substring(1, this.formula.length - 1);
    }
    const tree = new ReverseTree(this.formula);
    this.formula = this.build(tree.root);
    const result = await this.getFormula(propertyVals);
    return result;
  }
}
