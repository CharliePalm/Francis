import { NotionFormulaGenerator } from './NotionFormulaGenerator';
import * as Model from './model';
class ExampleFormula extends NotionFormulaGenerator {
    public dueDate = new Model.Date('Due date');
    public status = new Model.Select('Status');
    public tags = new Model.MultiSelect('Tags');
    public difficulty = new Model.Number('Difficulty');
    public blocked = new Model.Checkbox('Blocked');
    public completionPercent = new Model.Number('Completion %');
    public lastWorkedOn = new Model.Date('Last worked on');
    public holdOff = new Model.Date('Hold off till date');
        
    formula() {
        const shouldUsePriorityFactor = true; // flag for disabling priority factor while testing
        return this.round(this.buildFormula() * (shouldUsePriorityFactor ? this.getPriorityFactor() : 1));
    }

    buildFormula() {
        const addIfNotStarted = 10;
        if (this.status.value == 'Done' || this.blocked.value) {
            return 0;
        } else if (this.empty(this.dueDate.value)) {
            // for tasks with no real due date, we want to prioritize the dormant sigmoid as we won't be adding the due date sigmoid
            if (this.status.value == 'Not started' || this.completionPercent.value == 0) {
                return this.dormantSigmoid() * 3 + addIfNotStarted;
            } else {
                return 1.1 * this.dormantSigmoid() * this.getCompletionPercentageFactor();
            }
        } else if (this.status.value == 'Not started' || this.completionPercent.value == 0) {
            return (this.dueDateSigmoid() + this.dormantSigmoid()) * 2 + addIfNotStarted;
        }
        return ((this.dueDateSigmoid() + this.dormantSigmoid()) / 2) * this.getCompletionPercentageFactor();
    }
    
    /**
     * priority is represented by a sigmoid that scales based on days since worked on and days till due. These helper functions define this
     */

    // a measure of how long since we last touched this task
    dormantSigmoid() {
        return (25 / (1 + this.pow(this.e(), 3 - 1 * (.25 * this.daysSinceLastWorkedOn()))));
    }

    // a measure of how many days till the task is due
    dueDateSigmoid() {
        return (100 / (1 + this.pow(this.e(), (.2 * this.daysTillDue()))));
    }

    getPriorityFactor() {
        return ((this.difficulty.value ? this.difficulty.value : 10) / 300 + .83);
    }

    // start high, get lower as more complete
    getCompletionPercentageFactor() {
        return ((-1 * this.completionPercent.value) / 100 + 1.9);
    }

    // date utils:
    daysTillDue() {
        return this.max(this.dateBetween(this.dueDate.value, this.now(), 'days'), 0);
    }

    daysSinceLastWorkedOn() {
        return (this.lastWorkedOn.value ? this.dateBetween(this.now(), this.lastWorkedOn.value, 'days') : this.dateBetween(this.now(), this.createdTime.value, 'days'));
    }

    buildFunctionMap(): Map<string, string> {
        return new Map([
            ['getPriorityFactor', this.getPriorityFactor.toString()],
            ['daysSinceLastWorkedOn', this.daysSinceLastWorkedOn.toString()],
            ['daysTillDue', this.daysTillDue.toString()],
            ['buildFormula', this.buildFormula.toString()],
            ['dormantSigmoid', this.dormantSigmoid.toString()],
            ['getCompletionPercentageFactor', this.getCompletionPercentageFactor.toString()],
            ['dueDateSigmoid', this.dueDateSigmoid.toString()],
        ]);
    }
}

const n = new ExampleFormula();
console.log('Result:')
console.log(n.compile());