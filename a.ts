/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

export class MyString implements String {
    value: MyStringType; 
    public toLowerCase() {return true }
    public includes(toFind: MyStringType) { return true; }
    public replace(toReplace: MyStringType, toReplaceWith: MyStringType) { return this }
    public length(): number { return 0; }
}

export type MyStringType = (MyString & string | string | MyString); // should be either MyString or string

const myStringTest1 = new MyString();
const myStringTest2 = new MyString();

myStringTest1.includes('test');
myStringTest1.includes(myStringTest2);

myStringTest1.value + '';

export class MyList<T> {
    map(callback: (index: number, current: T) => any): MyList<any> { return this; }
}

const x = new MyList<MyStringType>();
x.map((a, b) => b.length())

export class MyNumber {
    value: MyNumberType;
    test(n: MyNumberType) {return n;}
}

export type MyNumberType = number | MyNumber | (MyNumber & number);

const myNumber1 = new MyNumber();
const myNumber2 = new MyNumber();
myNumber1 === myNumber2;
myNumber1.value === 2;
myNumber1.value < 2;
myNumber1.value > 2;
myNumber1.test(myNumber2);
