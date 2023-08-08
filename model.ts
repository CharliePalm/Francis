export class Property {
    constructor(public name: string) {}
}

export class Select extends Property {
    value = '';
}

export class MultiSelect extends Property {
    value = '';
}

export class Number extends Property {
    value = 0;
}

export class Text extends Property {
    value = '';
}

export class Date extends Property {
    value: NotionDate = {};
}

export class Person extends Property {
    value = '';
}

export class File extends Property {
    value = '';
}

export class Checkbox extends Property {
    value = true;
}

export class URL extends Property {
    value = '';
}

export class Email extends Property {
    value = '';
}

export class Phone extends Property {
    value = '';
}

export class Formula extends Property {
    value: number | string | NotionDate | boolean = '';
}

export class Relation extends Property {
    value = '';
}

export class Rollup extends Property {
    value = '';
}

export class CreatedTime extends Property {
    value = '';
}

export class CreatedBy extends Property {
    value = '';
}

export class LastEditedTime extends Property {
    value = '';
}

export class LastEditedBy extends Property {
    value = '';
}

export class NotionDate {}

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