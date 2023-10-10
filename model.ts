/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

// parent properties
export class Property {
    constructor(public propertyName?: string) {}
    and(): boolean { return true; }
    or(): boolean { return true; }
    not(): boolean { return true; }
    empty(): boolean { return true; }
    format(): NotionString { return new NotionString(); }
    equal(): boolean { return true; }
    unequal(): boolean { return true; }
}

export class NotionList extends Property {
    map(callback: (index: number, current: NotionType) => NotionType): NotionList { return this; }
    filter(callback: (current: NotionType) => boolean): NotionList { return this; }
    find(callback: (current: NotionType) => boolean): NotionList { return this; }
    findIndex(callback: (current: NotionType) => boolean): number { return 0; }
    some(callback: (current: NotionType) => boolean): boolean { return true; }
    every(callback: (current: NotionType) => boolean): boolean { return true; }
    at(index: number): NotionType { return ''; }
    slice(start: number, end?: number): NotionList { return this; }
    concat(...values: NotionList[]): NotionList { return this; }
    reverse(): NotionList { return this; }
    sort(): NotionList { return this; }
    join(intermediary: string): string { return ''; }
    unique(): NotionList { return this; }
    includes(value: NotionType): boolean { return true; }
    flat(): NotionList { return this; }
}

export class NotionString extends Property {
    length(): number { return 0; }
    substring(start: number, end?: number): string { return ''; }
    contains(toSearchFor: string): boolean { return true; }
    test(toMatch: string): boolean { return true; }
    match(regEx: string): NotionList { return new NotionList(); }
    replace(toFind: string, toReplace: string): string { return ''; }
    replaceAll(toFind: string, toReplace: string): string { return ''; }
    lower(): NotionString { return this; }
    upper(): NotionString { return this; }
    link(link: string): NotionString { return this; }
    style(...values: StyleType[]): NotionString { return this; }
    unstyle(...values: StyleType[]): NotionString { return this; }
    toNumber(): number { return 0; }
    parseDate(): Date { return new Date(); }
    split(splitter: string): NotionList { return new NotionList(); }
}

// properties
export class NotionNumber extends Property {
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
    max(...values: NotionNumber[]): NotionNumber { return this; }
    min(...values: NotionNumber[]): NotionNumber { return this; }
    round(): NotionNumber { return this; }
    add(value2: NotionNumber): NotionNumber { return this; }
    subtract(value1: NotionNumber, value2: NotionNumber): NotionNumber { return this; }
    sign(): NotionNumber { return this; }
    divide(denom: NotionNumber) { return this; }
    fromTimestamp(): Date {return new Date(); }
}

export class NotionDate extends Property {
    dateSubtract(num: number, unit: NotionDateType): NotionDate { return this; }
    dateAdd(num: number, unit: NotionDateType): NotionDate { return this; }
    formatDate(): NotionDate { return this; }
}

export class NotionPerson extends Property {
    name(): string { return '' }
    email(): string { return '' }
}

export class Person extends NotionPerson {
    value: NotionPerson;
}

export class Text extends NotionString {
    value: string;
}

export class Number extends NotionNumber {
    value: number;
}

export class Date extends NotionDate {
    value: NotionDate;
}

export class Checkbox extends Property {
    value: boolean;
}

export class Formula extends Property {
    value: NotionType;
}

export class MultiSelect extends NotionList {
    value: any[] | string;
}

export class Select extends NotionString {
    value: string;
}

export class File extends Text {}

export class URL extends Text {}

export class Email extends Text {}

export class Phone extends Text {}

export class Relation extends Formula {}

export class Rollup extends Property {
    value: NotionList;
}

export class CreatedTime extends Date {}

export class CreatedBy extends Person {}

export class LastEditedTime extends Date {}

export class LastEditedBy extends Person {}

// System
export type NotionType = Number | NotionString | string | number | boolean | Date | Person | NotionList;

export type StyleType = 'u' | 'b' | 'i' | 'c' | 's' | 
    'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red' | 
    'gray_background' | 'brown_background' | 'orange_background' | 'yellow_background' | 'green_background' | 'blue_background' | 'purple_background' | 'pink_background' | 'red_background';

export type NotionDateType = 'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds';

export enum PropertyType {
    Select,
    Number,
    Text,
    Status,
    Date,
    Person,
    File,
    Checkbox,
    URL,
    Email,
    Phone,
    Formula,
    Relation,
    Rollup,
    CreatedTime,
    CreatedBy,
    LastEditedTime,
    LastEditedBy,
}

export enum NodeType {
    Logic,
    Return,
    Wrapper,
}