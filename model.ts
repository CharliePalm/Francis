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
    format(): NotionStringType { return ''; }
    equal(): boolean { return true; }
    unequal(): boolean { return true; }
}

export class NotionList<T = NotionType> extends Property {
    map(callback: (index: NotionNumberType, current: T) => NotionType): NotionList<any> { return this; }
    filter(callback: (current: T) => boolean): NotionList<T> { return this; }
    find(callback: (current: T) => boolean): NotionList<T> { return this; }
    findIndex(callback: (current: T) => boolean): NotionNumberType { return 0; }
    some(callback: (current: T) => boolean): boolean { return true; }
    every(callback: (current: T) => boolean): boolean { return true; }
    match(regEx: NotionStringType): NotionList<T> { return this; }
    at(index: NotionNumberType): T { return '' as T; }
    slice(start: NotionNumberType, end?: NotionNumberType): NotionList<T> { return this; }
    concat(...values: NotionType[]): NotionList<T> { return this; }
    reverse(): NotionList<T> { return this; }
    sort(): NotionList<T> { return this; }
    join(intermediary: NotionStringType): NotionStringType { return ''; }
    unique(): NotionList<T> { return this; }
    includes(value: T): boolean { return true; }
    flat(): NotionList<T> { return this; }
}

export class NotionString extends Property {
    length(): NotionNumberType { return 0; }
    substring(start: NotionNumberType, end?: NotionNumberType): NotionStringType { return ''; }
    contains(toSearchFor: NotionStringType): boolean { return true; }
    test(toMatch: NotionStringType): boolean { return true; }
    match(regEx: NotionStringType): NotionList<NotionString> { return new NotionList(); }
    replace(toFind: NotionStringType, toReplace: NotionStringType): NotionStringType { return ''; }
    replaceAll(toFind: NotionStringType, toReplace: NotionStringType): NotionStringType { return ''; }
    lower(): NotionStringType { return this; }
    upper(): NotionStringType { return this; }
    link(link: NotionStringType): NotionStringType { return this; }
    style(...values: StyleType[]): NotionStringType { return this; }
    unstyle(...values: StyleType[]): NotionStringType { return this; }
    toNumber(): NotionNumberType { return 0; }
    parseDate(): Date { return new Date(); }
    split(splitter: NotionStringType): NotionList<NotionStringType> { return new NotionList<NotionStringType>(); }
}

// properties
export class NotionNumber extends Property {
    floor(): NotionNumberType { return this; } 
    ceil(): NotionNumberType { return this; }
    abs(): NotionNumberType { return this; }
    mod(divisor: NotionNumberType): NotionNumberType { return this; }
    sqrt(): NotionNumberType { return this; }
    cbrt(): NotionNumberType { return this; }
    pow(exponent: NotionNumberType): NotionNumberType { return this; } // returns this as base to the exponent
    log10(): NotionNumberType { return this; }
    log2(): NotionNumberType { return this; }
    ln(): NotionNumberType { return this; }
    exp(): NotionNumberType { return this; } // returns e to the this
    max(...values: NotionNumberType[]): NotionNumberType { return this; }
    min(...values: NotionNumberType[]): NotionNumberType { return this; }
    round(): NotionNumberType { return this; }
    add(value2: NotionNumberType): NotionNumberType { return this; }
    subtract(value1: NotionNumberType, value2: NotionNumberType): NotionNumberType { return this; }
    sign(): NotionNumberType { return this; }
    divide(denom: NotionNumberType) { return this; }
    fromTimestamp(): Date {return new Date(); }
}

export class NotionDate extends Property {
    dateSubtract(num: number, unit: NotionDateType): NotionDate { return this; }
    dateAdd(num: number, unit: NotionDateType): NotionDate { return this; }
    formatDate(): NotionDate { return this; }
}

export class NotionPerson extends Property {
    name(): NotionStringType { return '' }
    email(): NotionStringType { return '' }
}

export class Person extends NotionPerson {
    value: NotionPerson;
}

export class Text extends NotionString {
    value: NotionStringType;
}

export class Number extends NotionNumber {
    value: NotionNumberType;
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

export class MultiSelect<T = NotionStringType> extends NotionList<T> {
    value: NotionList<T>;
}

export class Select extends NotionString {
    value: NotionStringType;
}

export class File extends Text {}

export class URL extends Text {}

export class Email extends Text {}

export class Phone extends Text {}

export class Relation extends Formula {}

export class Rollup<T = NotionList<NotionType>> extends Property {
    value: T;
}

export class CreatedTime extends Date {}

export class CreatedBy extends Person {}

export class LastEditedTime extends Date {}

export class LastEditedBy extends Person {}

// System
export type NotionType = NotionNumberType | NotionStringType | boolean | NotionDate | NotionPerson | NotionList<any> | (NotionStringType & NotionNumberType & boolean & NotionDate & NotionPerson & NotionList<any>);

export type StyleType = 'u' | 'b' | 'i' | 'c' | 's' | 
    'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red' | 
    'gray_background' | 'brown_background' | 'orange_background' | 'yellow_background' | 'green_background' | 'blue_background' | 'purple_background' | 'pink_background' | 'red_background';

export type NotionDateType = 'years' | 'quarters' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds';

export type NotionStringType = NotionString | string | (NotionString & string);

export type NotionNumberType = NotionNumber | number | (NotionNumber & number);

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
