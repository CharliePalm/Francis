import { NotionFormulaGenerator } from './NotionFormulaGenerator';
import * as Model from './model';
class MyFirstFormula extends NotionFormulaGenerator {
    public dueDate = new Model.Date('Due date');
    public status = new Model.Select('Status');
    public tags = new Model.MultiSelect('Tags');
    public difficulty = new Model.Number('Difficulty');
    public blocked = new Model.Checkbox('Blocked');
    public completionPercent = new Model.Number('Completion %');
    public lastWorkedOn = new Model.Date('Last worked on');

    formula() {
        return this.round(this.buildFormula() * 100) / 100;
    }

    buildFormula() {
        const multiplier = 10;
        if (this.status.value == 'Done' || this.blocked.value) {
            return 0;
        } else if (this.format(this.dueDate.value) == '') {
            // for tasks with no real due date
            if (this.status.value != 'In Progress') {
                return (((this.difficulty.value + (100 / (this.completionPercent.value + 1)))) / 100) * multiplier;
            } else {
                return (((this.difficulty.value + (100 / (this.completionPercent.value + 1)))) / 100) * this.daysSinceLastWorkedOn();
            }
        } else if (this.dateBetween(this.dueDate.value, this.now(), 'days') <= 0) {
            // for tasks that are overdue we need to finish them pronto
            if (this.contains(this.tags.value, 'Must finish')) {
                return 100 + this.difficulty.value;
            } else {
                return 100 - this.completionPercent.value + this.difficulty.value;
            }
        } else if (this.dateBetween(this.dueDate.value, this.now(), 'days') <= 7) {
            return this.getDefaultPriority() * (7 / this.log2(this.daysTillDue()))
        } else if (this.status.value == 'Not started') {
            return this.getDefaultPriority() + 10;
        }
        return this.getDefaultPriority();
    }

    getDefaultPriority() {
        return (this.round((this.difficulty.value / 100) + 100 / (this.completionPercent.value + 1)) / 2) * 
            (this.log2(this.daysSinceLastWorkedOn() + 1) / (this.daysTillDue() + 1));
    }

    daysSinceLastWorkedOn() {
        return this.dateBetween(this.now(), this.lastWorkedOn.value, 'days');
    }

    daysTillDue() {
        return this.dateBetween(this.now(), this.lastWorkedOn.value, 'days');
    }

    buildFunctionMap(): Map<string, string> {
        const functionMap = new Map();
        functionMap
            .set('getDefaultPriority', this.getDefaultPriority.toString())
            .set('daysSinceLastWorkedOn', this.daysSinceLastWorkedOn.toString())
            .set('daysTillDue', this.daysTillDue.toString())
            .set('buildFormula', this.buildFormula.toString());
        return functionMap;
    }
}

const n = new MyFirstFormula();
console.log('Result:')
console.log(n.compile());