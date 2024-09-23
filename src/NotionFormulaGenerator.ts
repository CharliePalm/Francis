/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tree, Node } from "./helpers/tree";
import { NodeType, NotionList, NotionType, NotionString, StyleType, NotionDate, Person, NotionDateType, PropertyType, Date, Property, NotionPerson } from "./model";

export abstract class NotionFormulaGenerator {
    tree!: Tree;

    /**
     * implement your formula with this method
     */
    abstract formula(): any;

    public buildFunctionMap(): Map<string, string> {
        return new Map<string, string>();
    }

    /**
     * compiles the subclass' formula function
     * @returns the compiled formula
     */
    public compile(): string {
        const functionMap = this.buildFunctionMap();
        // update function map to check if other functions reference each other
        this.updateFunctionMap(functionMap);
        functionMap.keys()
        const constMap = new Map<string, string>();
        // begin replacements
        const formulaBody = this.formula.toString()
            .replace(new RegExp(`this\\.(${[...functionMap.keys()].join('|')})\\(\\)`, 'g'), (match, functionName) => functionMap.get(functionName) ?? match) // replace function calls
            .replace(/\/\/.*$/gm, '') // Remove all comments
            // remove constant definitions and populate the constant map
            .replace(/const\s+(\w+)\s*=\s*([^;]+);?/g, (_: string, var1: string, var2: string) => {
                constMap.set(var1, var2);
                return '';
            })
            // replace all constants with their values
            .replace(
                new RegExp(`(?<=[\\s{(*+-/])(${[...constMap.keys()].join('|')})(?=[\\s})+\\-/*;]|$)`, 'g'), 
                (match, constName) => 
                    constMap.get(constName) ?? match
                )
            .replace(/['`]/g, '"') // replace ' strings with "
            .replace(/(?<!\d)(\.)(?=\d)/g, '0$1') // add 0 in front of decimals that are between 0 and 1 (new update to formula API)
            .replace(/if\s*\([^{}]*\)\s*{\s*}\s*(else\s+if\s*\([^{}]*\)\s*{\s*}\s*)*/g, '') // remove empty ifs
            .replace(/"[^"]*"|(\s+)/g, (match, group1) => group1 ? '' : match) // Remove all whitespace not in single quotes
            .replace(/return/g, '') // Remove the return keyword
            .replace(/;/g, '') // Remove semicolons
            .slice(10, -1); // Remove formula() {} brackets
        // create tree
        console.log(formulaBody);
        this.tree = new Tree(formulaBody);
        console.log(this.tree);
        // replace references to database properties
        this.tree.root.replaceProperties(this.buildDbProps());
        const endResult = this.build(this.tree.root, '');
        return endResult;
    }

    /**
     * recursive method to build the formula from the tree
     * @param node - the current node
     * @param currentFormula - the current formula
     * @returns the completed formula for the step
     */
    public build(node: Node, currentFormula: string): string {
        switch (node.type) {
            case NodeType.Logic:
                currentFormula += 'if(' + node.statement + ','
                currentFormula = this.build(node.trueChild, currentFormula) + ',';
                currentFormula = this.build(node.falseChild, currentFormula);
                currentFormula += ')' + node.tail;
                break;
            case NodeType.Return:
                currentFormula += node.statement;
                break;
            case NodeType.Wrapper:
                node.wrappedChildren.forEach((child) => {
                    const idx = node.statement.indexOf('()') + 1;
                    const statement = node.statement.substring(0, idx);
                    currentFormula += statement;
                    currentFormula = this.build(child, currentFormula);
                    currentFormula += ')';
                    node.statement = node.statement.substring(idx + 1, node.statement.length)
                });
                currentFormula += node.tail;
                break;
        }
        return currentFormula;
    }

    private buildDbProps(): {[key: string]: Property} {
        const thisObj = this as {[key: string]: any};
        const validPropertyTypes = Object.values(PropertyType);
        const dbObj: {[key: string]: Property}  = {};
        Object.keys(thisObj)
            .filter((key) => validPropertyTypes.includes(thisObj[key].constructor?.name))
            .forEach((key) => dbObj[key] = thisObj[key]);
        return dbObj;
    }

    /**
     * replaces non-cyclic references to other functions in the function map with the function's code
     * @param input 
     */
    public updateFunctionMap(input: Map<string, string>) {
        // clean functions of functionName() and brackets
        const r = new RegExp(`this\\.(${[...input.keys()].join('|')})\\(\\)`, 'g');
        // baseFunctions represents functions that have no other function calls
        const baseFunctions: string[] = [];
        // toUpdate will contain all the functions that still have function calls to replace
        let toUpdate: string[] = [];
        input.forEach((f, key) => {
            f = f?.slice(key.length + 4, -1).trim();
            input.set(key, f);
        });
        input.forEach((f, key) => {
            if (f.match(r)) {
                toUpdate.push(key);
            } else {
                baseFunctions.push(key);
            }
        });
        while (toUpdate.length) {
            const continueUpdating: string[] = [];
            toUpdate.forEach((key) => {
                let f = input.get(key);
                if (!f) throw Error('internal error encountered while updating function map')
                f = f.replace(new RegExp(`this\\.(${baseFunctions.join('|')})\\(\\)`, 'g'), (match, functionName) => input.get(functionName) ?? match);
                input.set(key, f);
                if (!f.match(r)) {
                    baseFunctions.push(key);
                } else {
                    continueUpdating.push(key);
                }
            });
            if (continueUpdating.length === toUpdate.length) {
                throw Error('cycle found in function references');
            }
            toUpdate = continueUpdating;
        }
    }

    /**
     * these are all notion builtin functions and constants. The generator will convert these to the desired notion formula syntax when used correctly.
     * usage:
     *  this.function(functionParams)
     * the typescript compiler will check if you're using the functions correctly, and the generator will convert properly if typescript finds no compile time errors 
     */

    // constants
    true = true;
    false = false;

    // math functions
    pi(): number { return 0; }
    e(): number { return 0; }
    floor(value: number): number { return 0; } 
    ceil(value: number): number { return 0; }
    abs(value: number): number { return 0; }
    mod(value: number, divisor: number): number { return 0; }
    sqrt(value: number): number { return 0; }
    cbrt(value: number): number { return 0; }
    pow(base: number, exponent: number): number { return 0; }
    log10(value: number): number { return 0; }
    log2(value: number): number { return 0; }
    ln(value: number): number { return 0; }
    exp(value: number): number { return 0; }
    unaryMinus(value: number): number { return 0; }
    unaryPlus(value: number): number { return 0; }
    max(...values: number[]): number { return 0; }
    min(...values: number[]): number { return 0; }
    round(value: number): number { return 0; }
    add(value: number | string, value2: number | string): number | string { return 0; }
    subtract(value1: number, value2: number): number { return 0; }
    sign(value: number): number { return 0; }
    median(...values: NotionType[]): number { return 0; }
    mean(...values: NotionType[]): number { return 0; }

    // string operations
    concat(...values: NotionType[]): NotionList { return new NotionList(); }
    // used for inserting the intermediary character in between the entries of the array
    join(values: NotionList, intermediary: string): string { return ''; }
    substring(value: string, start: number, end?: number): string { return ''; }
    length(value: string | NotionList): number { return 0; }
    format(value: number | string | boolean | NotionDate): string { return ''; }
    toNumber(value: number | string | boolean | NotionDate): number { return 0; }
    contains(value: string | NotionList | any[], toSearchFor: string): boolean { return true; }
    replace(value: number | string | boolean, toFind: string, toReplace: string): string { return ''; }
    replaceAll(value: number | string | boolean, toFind: string, toReplace: string): string { return ''; }
    test(value: number | string | boolean, toMatch: string): boolean { return true; }
    empty(value: number | string | boolean | NotionDate): boolean { return true; }
    match(value: string, regEx: string): NotionList { return new NotionList(); }
    repeat(value: string, num: number): NotionString { return new NotionString(); }
    link(value: string, link: string): NotionString { return new NotionString(); }
    style(value: string, ...values: StyleType[]): NotionString { return new NotionString(); }
    unstyle(value: string, ...values: StyleType[]): NotionString { return new NotionString(); }
    parseDate(value: string): NotionDate { return new NotionDate(); }
    split(value: string, splitter: string): NotionList { return new NotionList(); }
    padStart(value: string, amount: number, padChar: string | number): NotionString { return new NotionString(); }
    padEnd(value: string, amount: number, padChar: string | number): NotionString { return new NotionString(); }

    // array operations
    map(list: NotionList | NotionType[], callback: (index: number, current: NotionType) => NotionType): NotionList { return new NotionList(); }
    filter(list: NotionList | NotionType[], callback: (current: NotionType) => boolean): NotionList { return new NotionList(); }
    find(list: NotionList | NotionType[], callback: (current: NotionType) => boolean): NotionList { return new NotionList(); }
    findIndex(list: NotionList | NotionType[], callback: (current: NotionType) => boolean): number { return 0; }
    some(list: NotionList | NotionType[], callback: (current: NotionType) => boolean): boolean { return true; }
    every(list: NotionList | NotionType[], callback: (current: NotionType) => boolean): boolean { return true; }
    at(list: NotionList | NotionType[], index: number): NotionType { return ''; }
    slice(list: NotionList | NotionType[], start: number, end?: number): NotionList { return new NotionList(); }
    reverse(list: NotionList | NotionType[]): NotionList { return new NotionList(); }
    sort(list: NotionList | NotionType[]): NotionList { return new NotionList(); }
    unique(list: NotionList | NotionType[]): NotionList { return new NotionList(); }
    includes(value: NotionType): boolean { return true; }
    flat(list: NotionList | NotionType[]): NotionList { return new NotionList(); }

    // Date operations
    dateStart(date: NotionDate): NotionDate { return new NotionDate(); }
    dateEnd(date: NotionDate): NotionDate { return new NotionDate(); }
    now(): NotionDate { return new NotionDate(); }
    timestamp(date: NotionDate): number { return 0; }
    fromTimestamp(timestamp: number): NotionDate { return new NotionDate(); }
    dateAdd(date: NotionDate, amount: number, units: NotionDateType): NotionDate { return new NotionDate(); }
    dateSubtract(date: NotionDate, amount: number, units: NotionDateType): NotionDate { return new NotionDate(); }
    dateBetween(date1: NotionDate, date2: NotionDate, units: NotionDateType): number { return 0; }
    formatDate(date: NotionDate, formatStr: string): string { return ''; }
    
    // returns minute of current hour, 0-59
    minute(date: NotionDate): number { return 0; }
    // returns hour of the day, 0-23
    hour(date: NotionDate): number { return 0; }
    // for day of the week, 1-7
    day(date: NotionDate): number { return 0; }
    // for calendar day, 1-31
    NotionDate(date: NotionDate): number { return 0; }
    // for calendar month, 1-12
    month(date: NotionDate): number { return 0; }
    // returns the year
    year(date: NotionDate): number { return 0; }

    // misc
    id(): string { return ''; }
    and(val1: any, val2: any): boolean { return true; }
    or(val1: any, val2: any): boolean { return true; }
    not(val: any): boolean { return true; }
    equal(val1: any, val2: any): boolean { return true; }
    unequal(val1: any, val2: any): boolean { return true; }
    name(person: NotionPerson): NotionString { return new NotionString(); }
    email(person: NotionPerson): NotionString { return new NotionString(); }

    // built in properties:
    createdTime = new Date('Created Time');
    createdBy = new Person('Created By');
}