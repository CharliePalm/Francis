import { NotionFormulaCodifier } from './src/NotionFormulaCodifier';
const formula =
  '(if((((toNumber(join(map(prop("Base Modifier"), format(current)), ",")) + prop("Other Bonus")) + (if(prop("Proficient"), toNumber(join(map(prop("Proficiency Bonus"), format(current)), ",")), 0))) >= 0), "+", "") + format((toNumber(join(map(prop("Base Modifier"), format(current)), ",")) + prop("Other Bonus")) + (if(prop("Proficient"), toNumber(join(map(prop("Proficiency Bonus"), format(current)), ",")), 0))))';
const result = new NotionFormulaCodifier(formula, {
  ['Base Modifier']: {
    name: 'tags',
    type: 'number',
    checkbox: {},
  },
  ['Other Bonus']: {
    name: 'level',
    type: 'number',
    relation: {},
  },
  Proficient: {
    name: 'amount',
    type: 'checkbox',
    relation: {},
  },
  'Proficiency Bonus': {
    name: 'amount',
    type: 'number',
  },
})
  .decompile()
  .then((res) => console.log(res));
