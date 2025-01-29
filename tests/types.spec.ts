import * as Model from '../src/model';

/*
 * This is a test of the compiler, not of logic. If this test compiler, it's good to go. 
 */
xdescribe('typing', () => {
    describe('strings', () => {
        const x = new Model.Text('test');
        const y = new Model.Select('test2');
        it('allows comparisons between objects extending NotionString', () => {
            expect(x === y).toBeDefined();
        });

        it('allows comparisons between objects and primitives', () => {
            expect(x.value === '').toBeDefined();
            expect(x.upper().value === '').toBeDefined();
        });

        it('allows either primitives or objects in function calls', () => {
            expect(y.contains(x)).toBeDefined();
            expect(y.contains(x.value)).toBeDefined();
            expect(y.contains('test')).toBeDefined();
        });

        it('allows either primitives or objects in function calls', () => {
            expect(y.contains(x)).toBeDefined();
            expect(y.contains(x.value)).toBeDefined();
            expect(y.contains('test')).toBeDefined();
        });

        it('allows chaining method calls', () => {
            expect(y.substring(1, 5).substring(0, 4).contains(x))
        });

        it('allows comparing chained method calls to primitives or objects', () => {
            expect(y.upper().substring(1, 4).lower().value === '');
            expect(y.upper().substring(1, 4).lower() === x);
        });

        it('uses length correctly and not the strings length', () => {
            expect(y.length().value === 3).toBeDefined();
            expect(y.length().abs()).toBeDefined();
        });
    });

    describe('numbers', () => {
        const x = new Model.Number('test');
        const y = new Model.Number('test2');
        it('allows comparisons between objects extending NotionString', () => {
            expect(x === y).toBeDefined();
        });

        it('allows comparisons between objects and primitives', () => {
            expect(x.value === 0).toBeDefined();
            expect(x.floor().value === 0).toBeDefined();
        });

        it('allows either primitives or objects in function calls', () => {
            expect(y.add(x)).toBeDefined();
            expect(y.add(0)).toBeDefined();
            expect(y.divide(x)).toBeDefined();
            expect(y.divide(3)).toBeDefined();
        });

        it('implenets the max and min functions correctly and allows either generic or object types as input', () => {
            expect(y.max(3, 5, 6, 7, 8)).toBeDefined();
            expect(y.max(3, 5, x, 7, 8)).toBeDefined();
            expect(y.min(3, 5, 6, 7, 8)).toBeDefined();
            expect(y.min(3, y.value, x, 7, 8)).toBeDefined();
        });

        it('allows chaining method calls and comparing to primitives or objects', () => {
            expect(y.max(1, 5).divide(y).sqrt().floor() === x).toBeDefined();
            expect(y.max(1, 5).divide(y).sqrt().ceil().value === 3).toBeDefined();
        });
    });

    describe('lists', () => {
        const x = new Model.NotionList<number>('test');
        const y = new Model.MultiSelect('test2');
        const num = new Model.NotionNumber('test3');
        const str = new Model.NotionString('test4');
        const date = new Model.Date('test5');
        const notionDate = new Model.Date('test5');
        it('allows comparisons between objects extending NotionString', () => {
            expect(x === y).toBeDefined();
        });

        it('allows either primitives or objects in function calls', () => {
            expect(y.join(str)).toBeDefined();
            expect(y.join(',')).toBeDefined();
            expect(y.at(0)).toBeDefined();
            expect(y.at(num)).toBeDefined();
        });

        it('implements the includes function correctly and allows any type as input', () => {
            expect(
                x.includes('a') === x.includes(str) === 
                x.includes(num) === x.includes(true) === 
                x.includes(date) === x.includes(date.value) ===
                x.includes(notionDate) === x.includes(new Model.NotionPerson('test')) ===
                x.includes(3) === x.includes(y)
            ).toBeDefined();
        });

        it('allows chaining method calls and comparing to primitives or objects', () => {
            expect(y.flat().reverse().sort().includes('test')).toBeDefined();
            expect(y.flat().format().lower() === str).toBeDefined();
        });

        describe('generic typing', () => {
            it('allows generic typing and method calls', () => {
                const g = new Model.NotionList<Model.Text>();
                expect(g.at(3) === str).toBeDefined();
                expect(g.at(3).value === '').toBeDefined();
            });

            it('allows generic typing with primitives', () => {
                const g = new Model.NotionList<string>();
                expect(g.at(3) === '').toBeDefined();
            });

            it('allows generic typing with numbers', () => {
                const g = new Model.NotionList<Model.Number>();
                expect(g.at(3) === num).toBeDefined();
                expect(g.at(3).value === 3).toBeDefined();
            });
        });

        describe('callbacks', () => {
            it('allows two parameter callbacks', () => {
                expect(x.map((index, current) => y.includes(current))).toBeDefined();
            });

            it('allows defining the type of callback parameters', () => {
                expect(x.map((index, current: Model.NotionString) => y.includes(current))).toBeDefined();
            });

            it('allows defining the type of callback parameters', () => {
                const newList = new Model.Formula<Model.NotionList<Model.Number>>();
                expect(newList.value.filter((test) => y.includes(test))).toBeDefined();
                expect(x.filter((test) => test > 0)).toBeDefined();
            });
        });
    });
});