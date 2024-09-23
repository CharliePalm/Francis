import { codify } from '../src/codify';
import { esLintFormat } from '../src/helpers/helpers';

const getBasic = (innerFormula: string) => `
    import { NotionFormulaGenerator } from './src/NotionFormulaGenerator';
    import * as Model from './src/model';
    class MyFirstFormula extends NotionFormulaGenerator {
        public myProperty = new Model.Checkbox('myProperty');

        formula() {
            ${innerFormula}
        }

        public buildFunctionMap(): Map<string, string> {
            return new Map([]);
        }
    }
`;

const getComplex = (innerFormula: string, wrappers: [string, string][]) => `
import { NotionFormulaGenerator } from './src/NotionFormulaGenerator';
import * as Model from './src/model';
class MyFirstFormula extends NotionFormulaGenerator {
    public myProperty = new Model.Checkbox('myProperty');

    formula() {
        ${innerFormula}
    }

    ${wrappers.reduce((prev, [name, content]) => prev + `${name}() {${content}}\n`, '')}

    public buildFunctionMap(): Map<string, string> {
        return new Map([${wrappers.reduce((prev, [name, ]) => prev + `\n['${name}', this.${name}.toString()],\n`, '')}]);
    }
}
`;


describe('codify', () => {
    it('should properly encode a basic formula', async () => {
        expect(await codify('if(prop("myProperty"),1,0)', {"myProperty": { id: '%3Cmrr', name: 'myProperty', type: 'checkbox', checkbox: {} }}))
        .toEqual(await esLintFormat(
            getBasic(`if (this.myProperty) {
                return 1;
            } else {
                return 0;
            }`)
        ));
    });

    describe('wrappers', () => {
        it('should properly handle a wrapper', async () => {
            expect(await codify('round(if(prop("my property"),1,0))', {"myProperty": { id: '%3Cmrr', name: 'myProperty', type: 'checkbox', checkbox: {} }}))
            .toEqual(await esLintFormat(
                getComplex('return this.round(this.func1());', [['func1', 'if (this.myProperty) {return 1;} else {return 0;}']]),
            ));
        });    
        
        it('should properly handle a double wrapper', async () => {
            expect(await codify('round(format(if(prop("my property"),1,0)))', {"myProperty": { id: '%3Cmrr', name: 'myProperty', type: 'checkbox', checkbox: {} }}))
            .toEqual(await esLintFormat(
                getComplex('return this.round(this.format(this.func1()));', [['func1', 'if (this.myProperty) {return 1;} else {return 0;}']]),
            ));
        });

        it('should properly handle a nested wrapper', async () => {
            expect(await codify(`round(if(prop("my property"),format(if(prop("other property"), 0, 1)),0))`, {"myProperty": { id: '%3Cmrr', name: 'myProperty', type: 'checkbox', checkbox: {} }, "otherProperty": { id: '%12Df3', name: 'myProperty', type: 'checkbox', checkbox: {} }}))
            .toEqual(await esLintFormat(
                getComplex(
                    'return this.round(this.func1());', 
                    [
                        ['func2', 'if (this.myProperty) {return this.format(this.func1());} else {return 0;}'],
                        ['func1', 'if (this.otherProperty) {return 0;} else {return 1;}'],
                    ],
                ),
            ));
        });
    });
});