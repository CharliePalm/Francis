import { NotionFormulaCodifier } from '../src/NotionFormulaCodifier';
import { esLintFormat } from '../src/helpers/helpers';
import { typeMap } from '../src/helpers/utils';
import { CodifyProperty } from '../src/model';

const getBasic = (innerFormula: string) =>
  esLintFormat(`
    import { NotionFormulaGenerator } from './src/NotionFormulaGenerator';
    import * as Model from './src/model';
    class MyFirstFormula extends NotionFormulaGenerator {
        public myProperty = new Model.Checkbox('myProperty');

        formula() {
            ${innerFormula}
        }
    }
`);

const capitalize = (s: string) => s.at(0)?.toUpperCase() + s.slice(1);

const getComplex = (
  innerFormula: string,
  wrappers: [string, string][],
  properties: Record<string, CodifyProperty> = {
    myProperty: { type: 'checkbox', name: 'myProperty' },
  }
) => {
  const mappedProperties = Object.keys(properties).map((prop) => [
    properties[prop].name,
    properties[prop].type,
  ]);
  return esLintFormat(`
    import { NotionFormulaGenerator } from './src/NotionFormulaGenerator';
    import * as Model from './src/model';
    class MyFirstFormula extends NotionFormulaGenerator {
      ${mappedProperties
        .map(
          (prop) =>
            `public ${prop[0]} = new Model.${typeMap(prop[1])}('${prop[0]}');`
        )
        .join('\n')}

      formula() {
        ${innerFormula}
      }

      ${wrappers
        .map((wrapper) => `${wrapper[0]}() {${wrapper[1]}}`)
        .join('\n\n')}
    }
    `);
};

describe('NotionFormulaCodifier', () => {
  describe('execReplace', () => {
    it('should replace callback functions', () => {
      expect(
        new NotionFormulaCodifier(
          'map(prop("myProperty"), format(current))',
          {}
        )['execReplace']()
      ).toEqual(
        'this.myProperty.map((index, current) => this.format(current))'
      );
    });

    it('should replace object callback functions', () => {
      expect(
        new NotionFormulaCodifier(
          'prop("myProperty").map(format(current))',
          {}
        )['execReplace']()
      ).toEqual(
        'this.myProperty.map((index, current) => this.format(current))'
      );
    });

    it('should replace "or" operators with js equivalents', () => {
      expect(
        new NotionFormulaCodifier(
          'prop("myProperty") or prop("otherProperty")',
          {}
        )['execReplace']()
      ).toEqual('this.myProperty || this.otherProperty');
    });

    it('should replace "and" operators with js equivalents', () => {
      expect(
        new NotionFormulaCodifier(
          'prop("myProperty") and prop("otherProperty")',
          {}
        )['execReplace']()
      ).toEqual('this.myProperty && this.otherProperty');
    });

    it('should remove whitespace from function calls', () => {
      expect(
        new NotionFormulaCodifier('if (prop("myProperty"), 1, 0)', {})[
          'execReplace'
        ]()
      ).toEqual('if(this.myProperty, 1, 0)');
    });

    it('does not duplicate current.prop and does not append .this incorrectly', () => {
      const formula =
        'prop("Classes").find(current.prop("isHighestLevel")).prop("Class")=="Bard"';
      const result = new NotionFormulaCodifier(formula, {
        Classes: { name: 'Classes', type: 'relation' },
        isHighestLevel: { name: 'isHighestLevel', type: 'checkbox' },
        Class: { name: 'Class', type: 'select' },
      })['execReplace']();

      expect(result).toEqual(
        'this.classes.find((index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Bard"'
      );
    });

    describe('replace not operators', () => {
      it('replaces not(...) with this.not(...) when no extra whitespace', () => {
        const result = new NotionFormulaCodifier('not(prop("A"))', {
          A: { name: 'A', type: 'checkbox' },
        })['execReplace']();
        expect(result).toEqual('this.not(this.a)');
      });

      it('replaces not ( ... ) with this.not(...) when there is a space before paren', () => {
        const result = new NotionFormulaCodifier('not (prop("A"))', {
          A: { name: 'A', type: 'checkbox' },
        })['execReplace']();
        expect(result).toEqual('this.not(this.a)');
      });

      it('replaces not with varied whitespace (leading/trailing and inner spaces)', () => {
        const result = new NotionFormulaCodifier(' not ( prop("A") )', {
          A: { name: 'A', type: 'checkbox' },
        })['execReplace']();
        expect(result).toEqual('this.not( this.a )');
      });

      it('replaces not\t(prop(...)) with this.not(...) when tab present', () => {
        const result = new NotionFormulaCodifier('not\t(prop("A"))', {
          A: { name: 'A', type: 'checkbox' },
        })['execReplace']();
        expect(result).toEqual('this.not(this.a)');
      });
    });

    it('Uses value accessor when preceded by current.', () => {
      const formula = 'prop("Skills").find(current.prop("Tags")=="STR")';
      const result = new NotionFormulaCodifier(formula, {
        Skills: { name: 'Skills', type: 'relation' },
        Tags: { name: 'Tags', type: 'select' },
      })['execReplace']();

      expect(result).toEqual(
        'this.skills.find((index, current) => current._valueAccessor("Tags")=="STR")'
      );
    });

    it('handles uppercase Prop(...) the same as prop(...)', () => {
      const result = new NotionFormulaCodifier('Prop("Base Modifier")', {
        'Base Modifier': { name: 'Base Modifier', type: 'rollup' },
      })['execReplace']();
      expect(result).toEqual('this.baseModifier');
    });

    it('should handle whatever happened here', () => {
      const formula =
        'not (prop("Classes").find(current.prop("isHighestLevel")).prop("Class")!="Barbarian" and prop("Classes").find(current.prop("isHighestLevel")).prop("Class")!="Pick your class here!")';
      const result = new NotionFormulaCodifier(formula, {
        Classes: { name: 'Classes', type: 'relation' },
        isHighestLevel: { name: 'isHighestLevel', type: 'checkbox' },
        Class: { name: 'Class', type: 'select' },
      })['execReplace']();
      expect(result).toEqual(
        'this.not(this.classes.find((index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")!="Barbarian" && this.classes.find((index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")!="Pick your class here!")'
      );
    });
  });

  xdescribe('catchFallThroughElse', () => {
    it('should replace a fallthrough else in a function call', () => {});
  });

  describe('reduceWrappers', () => {
    // todo, write some tests here
  });

  describe('wrapLogic', () => {});

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
      ).toEqual(await getBasic(`if(this.myProperty){return 1}else{return 0}`));
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
        const properties = {
          myProperty: {
            id: '%3Cmrr',
            name: 'myProperty',
            type: 'checkbox',
            checkbox: {},
          },
          otherProperty: {
            id: '%12Df3',
            name: 'otherProperty',
            type: 'checkbox',
            checkbox: {},
          },
        };
        expect(
          await new NotionFormulaCodifier(
            `round(if(prop("my property"),format(if(prop("other property"), 0, 1)),0))`,
            properties
          ).decompile()
        ).toEqual(
          await getComplex(
            'return this.round(this.func2());',
            [
              [
                'func2',
                'if (this.myProperty) {return this.format(this.func1());} else {return 0;}',
              ],
              ['func1', 'if (this.otherProperty) {return 0;} else {return 1;}'],
            ],
            properties
          )
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
              ['func2', 'if (this.myProperty) {return -1;} else {return -2;}'],
              ['func1', 'if (this.myProperty) {return 1;} else {return 0;}'],
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

    describe('examples/complex formulas', () => {
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
        const result = await new NotionFormulaCodifier(
          formula,
          props
        ).decompile();
        expect(result).toEqual(
          await getComplex(
            'return this.func3() + this.func4()',
            [
              ['func4', 'return this.format(this.func2());'],
              [
                'func3',
                `if (this.func2() >= 0) { return '+'; } else {return '';}`,
              ],
              [
                'func2',
                `return (this.toNumber(this.join(this.baseModifier.map((index, current) => this.format(current)),',')) +this.otherBonus.value +this.func1());`,
              ],
              [
                'func1',
                `if (this.proficient) {return this.toNumber(this.join(this.proficiencyBonus.map((index, current) => this.format(current)),','));} else {return 0;}`,
              ],
            ],
            props
          )
        );
      });
    });
  });
});
