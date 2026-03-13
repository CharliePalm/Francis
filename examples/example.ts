import { NotionFormulaGenerator } from '../src/NotionFormulaGenerator';
import * as Model from '../src/model';
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
    if (this.status.value === 'Done' || this.blocked.value) {
      return 0;
    }
    return this.round(this.computeVRuntime() * this.getNiceWeight());
  }

  // CFS-inspired: combines staleness, EDF urgency, and aging into a single priority score.
  computeVRuntime() {
    return (
      (this.getStalenessScore() +
        this.getDeadlineUrgency() +
        this.getAgingBonus()) *
      this.getCompletionFactor()
    );
  }

  // vruntime analog: tasks neglected longer accumulate scheduling priority.
  // Sigmoid saturates at 25 — contributes a baseline even without a deadline.
  getStalenessScore() {
    return (
      25 / (1 + this.pow(this.e(), 3 - 0.25 * this.daysSinceLastWorkedOn()))
    );
  }

  // EDF (Earliest Deadline First): urgency spikes sharply as the deadline closes in.
  // Range 0–75 (3x staleness) so approaching deadlines clearly dominate the ranking.
  // Tasks with no due date contribute 0 here and rely entirely on staleness.
  getDeadlineUrgency() {
    return this.empty(this.dueDate.value)
      ? 0
      : 75 / (1 + this.pow(this.e(), 0.35 * (this.daysTillDue() - 7)));
  }

  // Aging: prevent starvation for tasks that have never been started.
  // Mirrors Linux's priority aging — long-waiting tasks earn a flat boost.
  getAgingBonus() {
    return this.status.value === 'Not started' ||
      this.completionPercent.value === 0
      ? 10
      : 0;
  }

  // Process yield: tasks further along cede some priority to fresher work.
  // Range 0.9 (100% done) to 1.9 (0% done).
  getCompletionFactor() {
    return 1.9 - this.completionPercent.value / 100;
  }

  // Nice value weight: difficulty maps to a scheduling weight like Linux nice values.
  // Default difficulty (10) → ~0.86; scales linearly with importance.
  getNiceWeight() {
    return (this.difficulty.value ? this.difficulty.value : 10) / 300 + 0.83;
  }

  // date utils:
  daysTillDue() {
    return this.max(
      this.dateBetween(this.dueDate.value, this.now(), 'days'),
      0
    );
  }

  daysSinceLastWorkedOn() {
    return this.lastWorkedOn.value
      ? this.dateBetween(this.now(), this.lastWorkedOn.value, 'days')
      : this.dateBetween(this.now(), this.createdTime, 'days');
  }
}

const n = new ExampleFormula();
console.log('Result:');
console.log(n.compile());
