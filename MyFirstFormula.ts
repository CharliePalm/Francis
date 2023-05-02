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

    formula(): any {
        if (this.status.value == 'Done' || this.blocked.value) {
            return 0;
        } else if (this.format(this.dueDate.value) == '') {
            // for tasks with no real due date
            return (((this.difficulty.value + (100 / (this.completionPercent.value + 1)))) / 100)
                * this.log2(this.dateBetween(this.lastWorkedOn.value, this.now(), 'days'));
        } else if (this.dateBetween(this.dueDate.value, this.now(), 'days') <= 0) {
            // for tasks that are overdue we need to finish them pronto
            return 100;
        } else if (this.dateBetween(this.dueDate.value, this.now(), 'days') <= 7) {
            return this.getDefaultPriority() * this.log2(this.dateBetween(this.dueDate.value, this.now(), 'days'))
        } else {
            if (this.status.value == 'Not started') {
                return this.getDefaultPriority() + this.dateBetween(this.dueDate.value, this.now(), 'days');
            } else {
                return this.getDefaultPriority();
            }
        }
    }

    getDefaultPriority() {
        return (this.round(this.difficulty.value + 100 / (this.completionPercent.value + 1)) / 2) * 
            (this.dateBetween(this.dueDate.value, this.now(), 'days'));
    }

    buildFunctionMap(): Map<string, string> {
        const functionMap = new Map();
        functionMap.set('getDefaultPriority', this.getDefaultPriority.toString());
        return functionMap;
    }
}

const n = new MyFirstFormula();
console.log(n.compile());