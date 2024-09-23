/* eslint-disable no-case-declarations */
import { esLintFormat } from "./helpers/helpers";
import { Tree, Node } from "./helpers/tree";
import { lowerCamel, typeMap } from "./helpers/utils";
import { NodeType } from "./model";

const getFormula = (formula: string, properties: Record<string, string>[], wrappers: [string, string][]): Promise<string> => esLintFormat(`
import { NotionFormulaGenerator } from './src/NotionFormulaGenerator';
import * as Model from './src/model';
class MyFirstFormula extends NotionFormulaGenerator {
    ${properties.reduce((prev, property) => `public ${property.name} = new Model.${typeMap(property.type)}('${property.name}');\n`, '')}

    formula() {
        ${formula}
    }

    ${wrappers.reduce((prev, [name, content]) => prev + `${name}() {${content}}\n`, '')}

    public buildFunctionMap(): Map<string, string> {
        return new Map([${wrappers.reduce((prev, [name, ]) => prev + `\n['${name}', this.${name}.toString()],\n`, '')}]);
    }
}
`);


const build = (node: Node, wrappers: [string, string][], currentFormula = ''): string => {
    switch (node.type) {
        case NodeType.Logic:
            currentFormula += 'if (' + node.statement + ') {'
            currentFormula = build(node.trueChild, wrappers, currentFormula) + '} else {'
            currentFormula = build(node.falseChild, wrappers, currentFormula);
            currentFormula += '}'
            break;
        case NodeType.Return:
            currentFormula += 'return ' + node.statement + ';';
            break;
        case NodeType.Wrapper:
            let innerFormula = '';
            const innerWrappers: [string, string][] = [];
            node.wrappedChildren.forEach((child) => {
                innerFormula = build(child, innerWrappers, innerFormula);
            });
            currentFormula += 'return ' + node.statement + '(this.func' + (wrappers.length + 1) + '()' + node.tail + new Array(node.statement.split('(').length).fill(')').join('') + ';';
            wrappers.push(['func' + (wrappers.length + innerWrappers.length + 1), innerFormula]);
            innerWrappers.forEach((iw) => wrappers.push(iw));
            break;
    }
    return currentFormula;
}

export async function codify(formula: string, properties: Record<string, object>): Promise<string> {
    const propertyVals = Object.keys(properties).map((p) => properties[p]) as Record<string, string>[];
    formula = formula.replace(/prop\("(.*?)"\)/g, (match, propName) => `this.${lowerCamel(propName)}`);
    if (formula.charAt(0) === '(') { formula = formula.substring(1, formula.length) }
    const tree = new Tree(formula, true);
    // replace references to database properties
    const wrappers: [string, string][] = [];
    formula = build(tree.root, wrappers);
    const result = await getFormula(formula, propertyVals, wrappers);
    return result;
}
