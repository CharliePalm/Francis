import { Tree, Node } from "./helpers/tree";
import { NodeType, NotionDate } from "./model";

export abstract class NotionFormulaGenerator {
    tree!: Tree;

    /**
     * implement your formula with this method
     */
    abstract formula(): any;

    /**
     * returns the object associated with the property
     * @param property 
     * @returns 
     */
    public getProperty(property: string): any {
        return (this as {[key: string]: any})[property]
    }

    public compile(): string {
        const formulaBody = this.formula.toString()
            .replace(/^\/\/.*$/gm, '')
            .replace(/\s+/g, '') // Remove all whitespace
            .replace(/return/g, '') // Remove the return keyword
            .replace(/;/g, '') // Remove semicolons
            .slice(10, -1); // Remove formula() {} brackets
        // create tree
        this.tree = new Tree(formulaBody);
        // replace references to database properties
        this.replaceProperties(this.tree.root);
        this.replaceFunctionsAndOperators(this.tree.root);
        const endResult = this.build(this.tree.root, '');
        return endResult;
    }

    /**
     * replaces all refrences to db properties
     * @param node 
     */
    public replaceProperties(node: Node): void {
        if (!node) return;
        node.statement = node.statement.replace(/this\.(\w+)\.value/g, (_, property) => `prop("${this.getProperty(property)?.name}")`);
        this.replaceProperties(node.trueChild);
        this.replaceProperties(node.falseChild);
        const a = 'a' !< 'b';
    }

    /**
     * replaces all refrences to builtin notion functions and typescript operators
     * @param node 
     */
    public replaceFunctionsAndOperators(node: Node): void {
        if (!node) return;
        // replace all uses of this. with '', && with and, || with or, and ! with not when not followed by an equals sign
        node.statement = node.statement
            .replace(/this\./g, '')
            .replace(/&&/g, ' and ')
            .replace(/\|\|/g, ' or ')
            .replace(/!(?!=)/g, ' not ');
        this.replaceFunctionsAndOperators(node.trueChild);
        this.replaceFunctionsAndOperators(node.falseChild);
    }

    /**
     * recursive method to build the formula from the tree
     * @param node - the current node
     * @param currentFormula - the current formula
     * @returns the completed formula for the step
     */
    public build(node: Node, currentFormula: string): string {
        if (node.type == NodeType.Logic) {
            currentFormula += 'if(' + node.statement + ','
            currentFormula = this.build(node.trueChild, currentFormula) + ',';
            currentFormula = this.build(node.falseChild, currentFormula);
            currentFormula += ')';
        } else {
            currentFormula += node.statement;
        }
        return currentFormula;
    }
    /**
     * these are all notion builtin functions and constants. The generator will convert these to the desired notion formula syntax when used correctly.
     * usage:
     *  this.function(functionParams)
     * the typescript compiler will check if you're using the functions correctly, and the generator will convert properly if typescript finds no compile time errors 
     */

    // contants
    e = 0;
    pi = 0;
    true = true;
    false = false;

    // math functions
    floor(value: number): number { return 0; } 
    ceil(value: number): number { return 0; }
    abs(value: number): number { return 0; }
    mod(value: number, divisor: number): number { return 0; }
    sqrt(value: number): number { return 0; }
    pow(base: number, exponent: number): number { return 0; }
    log10(value: number): number { return 0; }
    log2(value: number): number { return 0; }
    ln(value: number): number { return 0; }
    exp(value: number): number { return 0}
    unaryMinus(value: number): number { return 0; }
    unaryPlus(value: number): number { return 0; }
    max(...values: number[]): number { return 0; }
    min(...values: number[]): number { return 0; }

    // string operations
    concat(...values: any): string { return ''; }
    join(...values: any): string { return ''; }
    slice(value: any, start: number, end?: number): string { return ''; }
    length(value: any): string { return ''; }
    format(value: any): string { return ''; }
    toNumber(value: any): string { return ''; }
    contains(value: any, toSearchFor: any): string { return ''; }
    replace(value: any, toFind: any, toReplace: any): string { return ''; }
    replaceAll(value: any, toFind: any, toReplace: any): string { return ''; }
    test(value: any, toMatch: any): boolean { return true; }
    empty(value: any): boolean { return true; }

    // date operations
    start(date: NotionDate): NotionDate { return {}; }
    end(date: NotionDate): NotionDate { return {}; }
    now(): NotionDate { return {}; }
    timestamp(date: NotionDate): NotionDate { return 0; }
    fromTimeStamp(timestamp: number): NotionDate { return {}; }
    dateAdd(date: NotionDate, amount: number, units: 'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'): NotionDate { return {}; }
    dateSubtract(date: NotionDate, amount: number, units: 'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'): NotionDate { return {}; }
    dateBetween(date1: NotionDate, date2: NotionDate, units: 'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'): number { return 0; }
    formatDate(date: NotionDate, formatStr: string): string { return ''; }
    minute(date: NotionDate): NotionDate { return 0; }
    hour(date: NotionDate): NotionDate { return 0; }
    // for day of the week
    day(date: NotionDate): NotionDate { return 0; }
    // for calendar day
    date(date: NotionDate): NotionDate { return 0; }
    month(date: NotionDate): NotionDate { return 0; }
    year(date: NotionDate): NotionDate { return 0; }

    // misc
    id(): string { return ''; }
    and(val1: any, val2: any): boolean { return true; }
    or(val1: any, val2: any): boolean { return true; }
    not(val: any): boolean { return true; }
}
