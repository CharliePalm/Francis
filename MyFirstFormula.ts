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
        return this.round(this.buildFormula());
    }

    buildFormula() {
        return this.daysTillDue();
    }

    getPriorityFactor() {
        return (this.difficulty.value / 100);
    }

    daysSinceLastWorkedOn() {
        return this.dateBetween(this.now(), this.lastWorkedOn.value, 'days');
    }

    daysTillDue() {
        return this.dateBetween(this.now(), this.dueDate.value, 'days');
    }

    /**
     * priority is represented by a sigmoid that scales based on 
     */
    getPriority() {
        return ((this.getPriorityFactor() / (this.max(this.daysTillDue(), 1))) / (1 + this.pow(this.e, -1 * this.daysSinceLastWorkedOn())));
    }

    buildFunctionMap(): Map<string, string> {
        return new Map([
            ['getPriorityFactor', this.getPriorityFactor.toString()],
            ['daysSinceLastWorkedOn', this.daysSinceLastWorkedOn.toString()],
            ['daysTillDue', this.daysTillDue.toString()],
            ['buildFormula', this.buildFormula.toString()],
            ['getPriority', this.getPriority.toString()],
        ]);
    }
}

const n = new MyFirstFormula();
console.log('Result:')
console.log(n.compile());