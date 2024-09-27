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

    describe('nested if statements', () => {
        it.only('should handle a simple nested if', async () => {
            expect(await codify('if(if(prop("my property"), 1, 0),1,0))', {"myProperty": { id: '%3Cmrr', name: 'myProperty', type: 'checkbox', checkbox: {} }}))
            .toEqual(await esLintFormat(
                getComplex('if (this.func1()) { return 1 } else { return 0; }', [['func1', 'if (this.myProperty) {return 1;} else {return 0;}']]),
            ));
        });
    });

    describe('examples/complex formulas', () => {
        it.skip('should handle a complex formula with callbacks', async () => {
            const props = {
                Modifier: {
                  id: '%3EtU%3B',
                  name: 'Modifier',
                  type: 'formula',
                  formula: {
                    expression: '(if((((toNumber(join(map({{notion:block_property:YLqZ:00000000-0000-0000-0000-000000000000:b2af8258-11a1-4080-8961-6a2b60fa44de}}, format(current)), ",")) + {{notion:block_property:bcDV:00000000-0000-0000-0000-000000000000:b2af8258-11a1-4080-8961-6a2b60fa44de}}) + (if({{notion:block_property:r%60Fa:00000000-0000-0000-0000-000000000000:b2af8258-11a1-4080-8961-6a2b60fa44de}}, toNumber(join(map({{notion:block_property:uupx:00000000-0000-0000-0000-000000000000:b2af8258-11a1-4080-8961-6a2b60fa44de}}, format(current)), ",")), 0))) >= 0), "+", "") + format((toNumber(join(map({{notion:block_property:YLqZ:00000000-0000-0000-0000-000000000000:b2af8258-11a1-4080-8961-6a2b60fa44de}}, format(current)), ",")) + {{notion:block_property:bcDV:00000000-0000-0000-0000-000000000000:b2af8258-11a1-4080-8961-6a2b60fa44de}}) + (if({{notion:block_property:r%60Fa:00000000-0000-0000-0000-000000000000:b2af8258-11a1-4080-8961-6a2b60fa44de}}, toNumber(join(map({{notion:block_property:uupx:00000000-0000-0000-0000-000000000000:b2af8258-11a1-4080-8961-6a2b60fa44de}}, format(current)), ",")), 0))))'
                  }
                },
                Prof: {
                  id: 'E%3Bjv',
                  name: 'Prof',
                  type: 'relation',
                  relation: {
                    database_id: '8dde4c98-62c8-412f-95cd-f7001f3da1cf',
                    type: 'single_property',
                    single_property: {}
                  }
                },
                'Base Modifier': {
                  id: 'YLqZ',
                  name: 'Base Modifier',
                  type: 'rollup',
                  rollup: {
                    rollup_property_name: 'Modifier',
                    relation_property_name: 'Skills',
                    rollup_property_id: 'qLRT',
                    relation_property_id: 'gtwQ',
                    function: 'show_original'
                  }
                },
                'Other Bonus': {
                  id: 'bcDV',
                  name: 'Other Bonus',
                  type: 'number',
                  number: { format: 'number' }
                },
                Skills: {
                  id: 'gtwQ',
                  name: 'Skills',
                  type: 'relation',
                  relation: {
                    database_id: '8dde4c98-62c8-412f-95cd-f7001f3da1cf',
                    type: 'single_property',
                    single_property: {}
                  }
                },
                Proficient: { id: 'r%60Fa', name: 'Proficient', type: 'checkbox', checkbox: {} },
                'Proficiency Bonus': {
                  id: 'uupx',
                  name: 'Proficiency Bonus',
                  type: 'rollup',
                  rollup: {
                    rollup_property_name: 'Modifier',
                    relation_property_name: 'Prof',
                    rollup_property_id: 'qLRT',
                    relation_property_id: 'E;jv',
                    function: 'show_original'
                  }
                },
                Skill: { id: 'title', name: 'Skill', type: 'title', title: {} }
            };
            const formula = `if((((toNumber(join(map(Prop("Base Modifier"), format(current)), ",")) + Prop("Other Bonus")) + (if(Prop("Proficient"), toNumber(join(map(Prop("Proficiency Bonus"), format(current)), ",")), 0))) >= 0), "+", "") + format((toNumber(join(map(Prop("Base Modifier"), format(current)), ",")) + Prop("Other Bonus")) + (if(Prop("Proficient"), toNumber(join(map(Prop("Proficiency Bonus"), format(current)), ",")), 0))))`;

            expect(await codify(formula, props)).toEqual('');

        });
    });
});