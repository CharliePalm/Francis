import { NotionFormulaCodifier } from './src/NotionFormulaCodifier';
const formula =
  '(if((((toNumber(join(map(prop("Base Modifier"), format(current)), ",")) + prop("Other Bonus")) + (if(prop("Proficient"), toNumber(join(map(prop("Proficiency Bonus"), format(current)), ",")), 0))) >= 0), "+", "") + format((toNumber(join(map(prop("Base Modifier"), format(current)), ",")) + prop("Other Bonus")) + (if(prop("Proficient"), toNumber(join(map(prop("Proficiency Bonus"), format(current)), ",")), 0))))';
const result = new NotionFormulaCodifier(formula, {
  ['Base Modifier']: {
    name: 'baseModifier',
    type: 'rollup',
    rollup: {},
  },
  ['Other Bonus']: {
    name: 'otherBonus',
    type: 'number',
    number: {},
  },
  Proficient: {
    name: 'proficient',
    type: 'checkbox',
    checkbox: {},
  },
  'Proficiency Bonus': {
    name: 'proficiencyBonus',
    type: 'rollup',
  },
})
  .decompile()
  .then((res) => console.log(res));
