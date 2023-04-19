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
        } else if (this.dateBetween(this.dueDate.value, this.now(), 'days') <= 0) {
            return 100;
        } else if (this.status.value == 'Not started') {
            return (this.difficulty.value) * (1 / this.dateBetween(this.dueDate.value, this.now(), 'days'));
        } else {
            return this.dateBetween(this.lastWorkedOn.value, this.now(), 'days') * (this.difficulty.value / 100 + 1)
        }
    }
}

const n = new MyFirstFormula();
console.log(n.compile());