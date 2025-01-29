/* eslint-disable @typescript-eslint/no-explicit-any */
import { NotionFormulaGenerator } from '../src/NotionFormulaGenerator'
import * as Model from '../src/model'
class MyFirstFormula extends NotionFormulaGenerator {
    // define DB properties here:
    public amount = new Model.Number('Amount');
    public class = new Model.Relation('Class');
    public level = new Model.Relation('Level');
    public skills = new Model.Relation('Skills');
    public Name = new Model.Text('Name');
    public otherBonus = new Model.Number('Other Bonus');

    formula() {
        if (this.Name.value === 'Melee Attack') {
            return (this.skills.find((s) => s._valueAccessor('Tags') === 'STR')._valueAccessor<Model.NotionString>('Modifier').toNumber().value + this.getProficiencyBonus() >= 0 ? '+' : '') + 
                this.format(this.skills.find((s) => s._valueAccessor('Tags') === 'STR')._valueAccessor<Model.NotionString>('Modifier').toNumber().value + this.getProficiencyBonus() + this.otherBonus.value);
        } else if (this.Name.value === 'Spell Attack') {
            if (!this.isCaster()) { return 0; }
            else { return '+' + this.format(this.getSpellAbilityMod() + this.getProficiencyBonus() + this.otherBonus.value); }
        } 
        else if (this.Name.value === 'Spell Save DC') {
            if (!this.isCaster()) {
                return 0;
            } else {
                return this.format(8 + this.getSpellAbilityMod() + this.getProficiencyBonus() + this.otherBonus.value);

            }
        } else if (this.Name.value === 'Initiative') {
            return ((this.skills.find((s) => s._valueAccessor('Tags') === 'DEX')._valueAccessor<Model.NotionString>('Modifier').toNumber().value + this.otherBonus.value) >= 0 ? '+' : '') + 
                this.format(this.skills.find((s) => s._valueAccessor('Tags') === 'DEX')._valueAccessor<Model.NotionString>('Modifier').toNumber().value + this.otherBonus.value);
        } else {
            return (this.skills.find((s) => s._valueAccessor('Tags') === 'DEX')._valueAccessor<Model.NotionString>('Modifier').toNumber().value + this.getProficiencyBonus() >= 0 ? '+' : '') + 
            this.format(this.skills.find((s) => s._valueAccessor('Tags') === 'DEX')._valueAccessor<Model.NotionString>('Modifier').toNumber().value + this.getProficiencyBonus() + this.otherBonus.value);
        }
    }

    isCaster() {
        return (this.getClass() === 'Wizard' || this.getClass() === 'Artificer' || this.getClass() === 'Rogue' || this.getClass() === 'Fighter' ||this.getClass() === 'Sorcerer' || this.getClass() === 'Bard' || this.getClass() === 'Paladin' || this.getClass() === 'Warlock' || this.getClass() === 'Druid' || this.getClass() === 'Ranger' || this.getClass() === 'Cleric' || this.getClass() === 'Monk')
    }

    getSpellAbilityMod() {
        if (this.getClass() === 'Wizard' || this.getClass() === 'Artificer' || this.getClass() === 'Rogue' || this.getClass() === 'Fighter') {
            return this.skills.find((s) => s._valueAccessor('Tags') === 'INT')._valueAccessor<Model.NotionString>('Modifier').toNumber().value;
        } else if (this.getClass() === 'Sorcerer' || this.getClass() === 'Bard' || this.getClass() === 'Paladin' || this.getClass() === 'Warlock') {
            return this.skills.find((s) => s._valueAccessor('Tags') === 'CHA')._valueAccessor<Model.NotionString>('Modifier').toNumber().value;
        } else if (this.getClass() === 'Druid' || this.getClass() === 'Ranger' || this.getClass() === 'Cleric' || this.getClass() === 'Monk') {
            return this.skills.find((s) => s._valueAccessor('Tags') === 'WIS')._valueAccessor<Model.NotionString>('Modifier').toNumber().value;
        }
        return 0;
    }

    getClass() {
        return this.class.at(0)._valueAccessor<Model.NotionString>('Value').value;
    }

    getProficiencyBonus(): number {
        return this.skills.find((skill: Model.NotionObject) => skill._valueAccessor('Tags') === 'PROF')._valueAccessor<Model.NotionString>('Modifier').toNumber().value;
    }

    /**
     * If you want to use helper functions, define them here like this
     * @returns
     */
    public buildFunctionMap(): Map<string, string> {
        return new Map([
            ['getClass', this.getClass.toString()],
            ['getSpellAbilityMod', this.getSpellAbilityMod.toString()],
            ['isCaster', this.isCaster.toString()],
            ['getProficiencyBonus', this.getProficiencyBonus.toString()],
        ])
    }
}

const formula = new MyFirstFormula()
console.log('result: ')
console.log(formula.compile())
