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
            return ((this.difficulty.value * (1 / this.completionPercent.value)) / 10)
                * this.log2(this.dateBetween(this.lastWorkedOn.value, this.now(), 'days'));
        } else if (this.dateBetween(this.dueDate.value, this.now(), 'days') <= 0) {
            // for tasks that are overdue we need to finish them pronto
            return 100;
        } else if (this.status.value == 'Not started') {
            // hard tasks that we're putting off need to be prioritized
            return (this.difficulty.value + 1) * (10 / this.dateBetween(this.dueDate.value, this.now(), 'days'));
        } else if (this.dateBetween(this.dueDate.value, this.now(), 'days') <= 7) {
            return (1 / this.dateBetween(this.dueDate.value, this.now(), 'days')) * 
                    (this.difficulty.value) * this.log2(1 / (this.completionPercent.value + 1))
        } else {
            if (this.dateBetween(this.lastWorkedOn.value, this.now(), 'days') >= 5) {
                // more than 5 days since we last touched it
                return this.log2(this.dateBetween(this.lastWorkedOn.value, this.now(), 'days')) *
                    (1 / (this.dateBetween(this.dueDate.value, this.now(), 'days')))
                    * (this.difficulty.value / 10 + 1);
            } else {
                return ((this.dateBetween(this.lastWorkedOn.value, this.now(), 'days') / (this.completionPercent.value / 10 + 1)) / 
                        (this.dateBetween(this.dueDate.value, this.now(), 'days') + this.completionPercent.value))
                        * (this.difficulty.value / 10);
            }
        }
    }
}

const n = new MyFirstFormula();
console.log(n.compile());