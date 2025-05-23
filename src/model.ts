/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

// parent properties
export class Property {
    constructor(public propertyName?: string) {}
    and(): boolean { return true; }
    or(): boolean { return true; }
    not(): boolean { return true; }
    empty(): boolean { return true; }
    format(): NotionString { return {} as NotionString; }
    equal(): boolean { return true; }
    unequal(): boolean { return true; }
}

export class NotionList<T = NotionObject> extends Property {
    value!: T;
    // lists do not include a value because comparisons between arrays in general shouldn't be done. 
    map(callback: (index: NotionNumberType | any, current: T | any) => NotionType): NotionList<any> { return this; }
    filter(callback: (current: T) => boolean): NotionList<T> { return this; }
    find(callback: (current: T) => boolean): T { return this.value; }
    findIndex(callback: (current: T) => boolean): NotionNumberType { return 0; }
    some(callback: (current: T) => boolean): boolean { return true; }
    every(callback: (current: T) => boolean): boolean { return true; }
    at(index: NotionNumberType): T { return {} as T; }
    slice(start: NotionNumberType, end?: NotionNumberType): NotionList<T> { return this; }
    concat(...values: NotionList<T>[]): NotionList<T> { return this; }
    reverse(): NotionList<T> { return this; }
    sort(): NotionList<T> { return this; }
    join(intermediary: NotionStringType): string { return ''; }
    unique(): NotionList<T> { return this; }
    includes(value: NotionType): boolean { return true; }
    flat(): NotionList<T> { return this; }
    length(): NotionNumber { return {} as NotionNumber; }
}

export class NotionString extends Property {
    value!: string;
    length(): NotionNumber { return {} as NotionNumber; } // unfortunately, notion and typescript disagree on the type signature here. We'll add the () when we compile the formula
    substring(start: NotionNumberType, end?: NotionNumberType): NotionString { return this; }
    contains(toSearchFor: NotionStringType): boolean { return true; }
    test(toMatch: NotionStringType): boolean { return true; }
    match(regEx: NotionStringType): NotionList { return new NotionList(); }
    replace(toFind: NotionStringType, toReplace: NotionStringType): NotionString { return this; }
    replaceAll(toFind: NotionStringType, toReplace: NotionStringType): NotionString { return this; }
    lower(): NotionString { return this; }
    upper(): NotionString { return this; }
    link(link: NotionStringType): NotionString { return this; }
    style(...values: StyleType[]): NotionString { return this; }
    unstyle(...values: StyleType[]): NotionString { return this; }
    toNumber(): NotionNumber { return {} as NotionNumber; }
    parseDate(): Date { return new Date(); }
    split(splitter: NotionStringType): NotionList { return new NotionList(); }
    padStart(value: string, amount: number, padChar: string | number): NotionString { return new NotionString(); }
    padEnd(value: string, amount: number, padChar: string | number): NotionString { return new NotionString(); }
}

export class NotionNumber extends Property {
    value = 0;
    floor(): NotionNumber { return this; } 
    ceil(): NotionNumber { return this; }
    abs(): NotionNumber { return this; }
    mod(divisor: NotionNumber): NotionNumber { return this; }
    sqrt(): NotionNumber { return this; }
    cbrt(): NotionNumber { return this; }
    pow(exponent: NotionNumber): NotionNumber { return this; } // returns this as base to the exponent
    log10(): NotionNumber { return this; }
    log2(): NotionNumber { return this; }
    ln(): NotionNumber { return this; }
    exp(): NotionNumber { return this; } // returns e to the this
    max(...values: NotionNumberType[]): NotionNumber { return this; }
    min(...values: NotionNumberType[]): NotionNumber { return this; }
    round(): NotionNumber { return this; }
    add(value2: NotionNumberType): NotionNumber { return this; }
    subtract(value1: NotionNumberType, value2: NotionNumberType): NotionNumber { return this; }
    sign(): NotionNumber { return this; }
    divide(denom: NotionNumberType) { return this; }
    fromTimestamp(): Date {return new Date(); }
}

export class NotionObject extends Property {
    /**
     * A function to get a value from an object.
     * Transformed by the compiler to be prop("{{propertyName}}")
     * */ 
    _valueAccessor<T>(propertyName: string): T { return {} as T };
}

export class NotionDate extends Property {
    dateSubtract(num: NotionNumberType, unit: NotionDateType): NotionDate { return this; }
    dateAdd(num: NotionNumberType, unit: NotionDateType): NotionDate { return this; }
    formatDate(format: NotionStringType): NotionString { return {} as NotionString; }
}

export class NotionPerson extends Property {
    name(): NotionString { return {} as NotionString; }
    email(): NotionString { return {} as NotionString; }
}

// properties
export class Person extends NotionPerson {
    value!: NotionPerson;
}

export class Number extends NotionNumber {
    value!: number;
}

export class Date extends NotionDate {
    value!: NotionDate;
}

export class Checkbox extends Property {
    value!: boolean;
}

export class Formula<T = any> extends Property {
    value!: T;
}

export class Text extends NotionString {}

export class Select extends NotionString {}

export class File extends Text {}

export class URL extends Text {}

export class Email extends Text {}

export class Phone extends Text {}

export class Relation<T = NotionObject> extends NotionList<T> {}

export class MultiSelect<T = any> extends NotionList<T> {}

export class Rollup<T = NotionObject> extends NotionList<T> {}

export class CreatedTime extends Date {}

export class CreatedBy extends Person {}

export class LastEditedTime extends Date {}

export class LastEditedBy extends Person {}

// System
export type NotionType = NotionNumber | NotionString | string | number | boolean | NotionList | NotionDate | NotionPerson;

export type StyleType = 'u' | 'b' | 'i' | 'c' | 's' | 
    'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red' | 
    'gray_background' | 'brown_background' | 'orange_background' | 'yellow_background' | 'green_background' | 'blue_background' | 'purple_background' | 'pink_background' | 'red_background';

export type NotionDateType = 'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds';

export type NotionStringType = NotionString & string | string | NotionString;

export type NotionNumberType = NotionNumber & number | number | NotionNumber;

export enum PropertyType {
    Select = 'Select',
    Number = 'Number',
    Text = 'Text',
    Status = 'Status',
    Date = 'Date',
    Person = 'Person',
    File = 'File',
    Checkbox = 'Checkbox',
    URL = 'URL',
    Email = 'Email',
    Phone = 'Phone',
    Formula = 'Formula',
    Relation = 'Relation',
    MultiSelect = 'MultiSelect',
    Rollup = 'Rollup',
    CreatedTime = 'CreatedTime',
    CreatedBy = 'CreatedBy',
    LastEditedTime = 'LastEditedTime',
    LastEditedBy = 'LastEditedBy',
}

export enum NodeType {
    Logic = 'Logic',
    Return = 'Return',
    Wrapper = 'Wrapper',
    Combination = 'Combination',
}
