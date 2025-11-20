import {
  NotionFormulaCodifier,
  CodifyProperty,
} from '../src/NotionFormulaCodifier';
import { esLintFormat } from '../src/helpers/helpers';

const getBasic = (innerFormula: string) =>
  esLintFormat(`
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
`);

const getComplex = (
  innerFormula: string,
  wrappers: [string, string][],
  properties: [string, string][] = [['myProperty', 'Checkbox']]
) =>
  esLintFormat(`
import { NotionFormulaGenerator } from './src/NotionFormulaGenerator';
import * as Model from './src/model';
class MyFirstFormula extends NotionFormulaGenerator {
    ${properties
      .map((prop) => `public ${prop[0]} = new Model.${prop[1]}('${prop[0]}');`)
      .join('\n')}

    formula() {
        ${innerFormula}
    }

    ${wrappers.reduce(
      (prev, [name, content]) => prev + `${name}() {${content}}\n`,
      ''
    )}

    public buildFunctionMap(): Map<string, string> {
        return new Map([${wrappers.reduce(
          (prev, [name]) => prev + `\n['${name}', this.${name}.toString()],\n`,
          ''
        )}]);
    }
}
`);

describe('NotionFormulaCodifier', () => {
  describe('execReplace', () => {
    it('should replace callback functions', () => {
      expect(
        new NotionFormulaCodifier(
          'map(prop("myProperty"), format(current))',
          {}
        ).execReplace()
      ).toEqual(
        'this.myProperty.map((index, current) => this.format(current))'
      );
    });
    it('should replace object callback functions', () => {
      expect(
        new NotionFormulaCodifier(
          'prop("myProperty").map(format(current))',
          {}
        ).execReplace()
      ).toEqual(
        'this.myProperty.map((index, current) => this.format(current))'
      );
    });
  });

  describe('e2e', () => {
    it('should properly encode a basic formula', async () => {
      expect(
        await new NotionFormulaCodifier('if(prop("myProperty"),1,0)', {
          myProperty: {
            id: '%3Cmrr',
            name: 'myProperty',
            type: 'checkbox',
            checkbox: {},
          },
        }).decompile()
      ).toEqual(
        await getBasic(`if (this.myProperty) {
                return 1;
            } else {
                return 0;
            }`)
      );
    });

    describe('wrappers', () => {
      it('should properly handle a wrapper', async () => {
        expect(
          await new NotionFormulaCodifier(
            'round(if(prop("my property"),1,0))',
            {
              myProperty: {
                id: '%3Cmrr',
                name: 'myProperty',
                type: 'checkbox',
                checkbox: {},
              },
            }
          ).decompile()
        ).toEqual(
          await getComplex('return this.round(this.func1());', [
            ['func1', 'if (this.myProperty) {return 1;} else {return 0;}'],
          ])
        );
      });

      it('should properly handle a double wrapper', async () => {
        expect(
          await new NotionFormulaCodifier(
            'round(format(if(prop("my property"),1,0)))',
            {
              myProperty: {
                id: '%3Cmrr',
                name: 'myProperty',
                type: 'checkbox',
                checkbox: {},
              },
            }
          ).decompile()
        ).toEqual(
          await getComplex('return this.round(this.func2());', [
            ['func2', 'return this.format(this.func1());'],
            ['func1', 'if (this.myProperty) {return 1;} else {return 0;}'],
          ])
        );
      });

      it('should properly handle a nested wrapper', async () => {
        expect(
          await new NotionFormulaCodifier(
            `round(if(prop("my property"),format(if(prop("other property"), 0, 1)),0))`,
            {
              myProperty: {
                id: '%3Cmrr',
                name: 'myProperty',
                type: 'checkbox',
                checkbox: {},
              },
              otherProperty: {
                id: '%12Df3',
                name: 'myProperty',
                type: 'checkbox',
                checkbox: {},
              },
            }
          ).decompile()
        ).toEqual(
          await getComplex('return this.round(this.func2());', [
            [
              'func2',
              'if (this.myProperty) {return this.format(this.func1());} else {return 0;}',
            ],
            ['func1', 'if (this.otherProperty) {return 0;} else {return 1;}'],
          ])
        );
      });
    });

    describe('nested if statements', () => {
      it('should handle a simple nested if', async () => {
        expect(
          await new NotionFormulaCodifier(
            'if(if(prop("my property"), 1, 0),1,0)',
            {
              myProperty: {
                id: '%3Cmrr',
                name: 'myProperty',
                type: 'checkbox',
                checkbox: {},
              },
            }
          ).decompile()
        ).toEqual(
          await getComplex(
            'if (this.func1()) { return 1 } else { return 0; }',
            [['func1', 'if (this.myProperty) {return 1;} else {return 0;}']]
          )
        );
      });

      it('should handle a complicated nested if', async () => {
        const formula = `if(1 + if(prop("myProperty"), 1, 0) >= 0, "1", "0")`;
        const properties = {
          myProperty: {
            name: 'myProperty',
            type: 'checkbox',
            relation: {},
          },
        };
        const result = await new NotionFormulaCodifier(
          formula,
          properties
        ).decompile();
        expect(result).toEqual(
          await getComplex(
            'if (1 + this.func1() >= 0) { return "1" } else { return "0"; }',
            [['func1', 'if (this.myProperty) {return 1;} else {return 0;}']]
          )
        );
      });

      it('should handle combinations of nested ifs', async () => {
        const formula = `if(1 + if(prop("myProperty"), 1, 0) - if(prop("myProperty"), -1, -2) + 1 >= 0, "1", "0")`;
        const properties = {
          myProperty: {
            name: 'myProperty',
            type: 'checkbox',
            relation: {},
          },
        };
        const result = await new NotionFormulaCodifier(
          formula,
          properties
        ).decompile();
        expect(result).toEqual(
          await getComplex(
            'if (1 + this.func1() - this.func2() + 1 >= 0) { return "1" } else { return "0"; }',
            [
              ['func1', 'if (this.myProperty) {return 1;} else {return 0;}'],
              ['func2', 'if (this.myProperty) {return -1;} else {return -2;}'],
            ]
          )
        );
      });
    });

    it('should handle two depth nested ifs', async () => {
      const formula = `if(1 + if(if(1, -1, 2) + toNumber(prop("myProperty")), 1, 0) >= 0, "1", "0")`;
      const properties = {
        myProperty: {
          name: 'myProperty',
          type: 'checkbox',
          relation: {},
        },
      };
      const result = await new NotionFormulaCodifier(
        formula,
        properties
      ).decompile();
      expect(result).toEqual(
        await getComplex(
          'if (1 + this.func2() >= 0) { return "1" } else { return "0"; }',
          [
            [
              'func2',
              'if (this.func1() + this.toNumber(this.myProperty)) {return 1;} else {return 0;}',
            ],
            ['func1', 'if (1) {return -1;} else {return 2;}'],
          ]
        )
      );
    });

    describe('callback', () => {
      it('should handle a simple callback', async () => {
        const formula = `this.map(prop("myProperty"), format(current))`;
        expect(
          await new NotionFormulaCodifier(formula, {
            myProperty: { type: 'checkbox', name: 'myProperty' },
          }).decompile()
        ).toEqual(
          await getBasic(
            `return this.myProperty.map((index, current) => this.format(current));`
          )
        );
      });

      it('should handle an object callback', async () => {
        const formula = `prop("myProperty").every(format(current))`;
        expect(
          await new NotionFormulaCodifier(formula, {
            myProperty: { type: 'checkbox', name: 'myProperty' },
          }).decompile()
        ).toEqual(
          await getBasic(
            `return this.myProperty.every((index, current) => this.format(current));`
          )
        );
      });
    });

    xdescribe('examples/complex formulas', () => {
      it('should handle a complex formula with callbacks', async () => {
        const props = {
          Modifier: {
            id: '%3EtU%3B',
            name: 'Modifier',
            type: 'formula',
            formula: {
              expression:
                'if((((toNumber(join(map({{notion:block_property:YLqZ:00000000-0000-0000-0000-000000000000:b2af8258-11a1-4080-8961-6a2b60fa44de}}, format(current)), ",")) + {{notion:block_property:bcDV:00000000-0000-0000-0000-000000000000:b2af8258-11a1-4080-8961-6a2b60fa44de}}) + (if({{notion:block_property:r%60Fa:00000000-0000-0000-0000-000000000000:b2af8258-11a1-4080-8961-6a2b60fa44de}}, toNumber(join(map({{notion:block_property:uupx:00000000-0000-0000-0000-000000000000:b2af8258-11a1-4080-8961-6a2b60fa44de}}, format(current)), ",")), 0))) >= 0), "+", "") + format((toNumber(join(map({{notion:block_property:YLqZ:00000000-0000-0000-0000-000000000000:b2af8258-11a1-4080-8961-6a2b60fa44de}}, format(current)), ",")) + {{notion:block_property:bcDV:00000000-0000-0000-0000-000000000000:b2af8258-11a1-4080-8961-6a2b60fa44de}}) + (if({{notion:block_property:r%60Fa:00000000-0000-0000-0000-000000000000:b2af8258-11a1-4080-8961-6a2b60fa44de}}, toNumber(join(map({{notion:block_property:uupx:00000000-0000-0000-0000-000000000000:b2af8258-11a1-4080-8961-6a2b60fa44de}}, format(current)), ",")), 0)))',
            },
          },
          Prof: {
            id: 'E%3Bjv',
            name: 'Prof',
            type: 'relation',
            relation: {
              database_id: '8dde4c98-62c8-412f-95cd-f7001f3da1cf',
              type: 'single_property',
              single_property: {},
            },
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
              function: 'show_original',
            },
          },
          'Other Bonus': {
            id: 'bcDV',
            name: 'Other Bonus',
            type: 'number',
            number: { format: 'number' },
          },
          Skills: {
            id: 'gtwQ',
            name: 'Skills',
            type: 'relation',
            relation: {
              database_id: '8dde4c98-62c8-412f-95cd-f7001f3da1cf',
              type: 'single_property',
              single_property: {},
            },
          },
          Proficient: {
            id: 'r%60Fa',
            name: 'Proficient',
            type: 'checkbox',
            checkbox: {},
          },
          'Proficiency Bonus': {
            id: 'uupx',
            name: 'Proficiency Bonus',
            type: 'rollup',
            rollup: {
              rollup_property_name: 'Modifier',
              relation_property_name: 'Prof',
              rollup_property_id: 'qLRT',
              relation_property_id: 'E;jv',
              function: 'show_original',
            },
          },
          Skill: { id: 'title', name: 'Skill', type: 'title', title: {} },
        };
        const formula = `if((((toNumber(join(map(Prop("Base Modifier"), format(current)), ",")) + Prop("Other Bonus")) + (if(Prop("Proficient"), toNumber(join(map(Prop("Proficiency Bonus"), format(current)), ",")), 0))) >= 0), "+", "") + format((toNumber(join(map(Prop("Base Modifier"), format(current)), ",")) + Prop("Other Bonus")) + (if(Prop("Proficient"), toNumber(join(map(Prop("Proficiency Bonus"), format(current)), ",")), 0))))`;

        expect(
          await new NotionFormulaCodifier(formula, props).decompile()
        ).toEqual('');
      });
    });
  });
});
