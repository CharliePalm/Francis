import { NotionFormulaCodifier } from './src/NotionFormulaCodifier';
const formula =
  'if(prop("Tags")=="PROF",("+"+format(ceil(toNumber(prop("ClassLevel").at(0).prop("Level"))/4)+1)),((prop("Amount")>=10?"+":"")+format(floor((prop("Amount")-10)/2))))';
const result = new NotionFormulaCodifier(formula, {
  ['Amount']: {
    name: 'Amount',
    type: 'number',
    rollup: {},
  },
  ['Tags']: {
    name: 'Tags',
    type: 'select',
    number: {},
  },
  ['ClassLevel']: {
    name: 'ClassLevel',
    type: 'relation',
    checkbox: {},
  },
})
  .decompile()
  .then((res) => console.log(res));

import { NotionFormulaGenerator } from './src/NotionFormulaGenerator';
import * as Model from './src/model';
class MyFirstFormula extends NotionFormulaGenerator {
  public amount = new Model.Number('Amount');
  public tags = new Model.Select('Tags');
  public level = new Model.Rollup<Model.NotionNumber>('_level');

  formula() {
    if (this.tags.value == 'PROF') {
      return '+' + this.format(this.ceil(this.level.value.value / 4) + 1);
    } else {
      return (
        (this.amount.value >= 10 ? '+' : '') +
        this.format(this.floor((this.amount.value - 10) / 2))
      );
    }
  }
}

console.log(new MyFirstFormula().compile());
