import { NotionFormulaGenerator } from '../src/NotionFormulaGenerator';
import * as Model from '../src/model';
class MyFirstFormula extends NotionFormulaGenerator {
    // define DB properties here:
    public myProperty = new Model.Checkbox('myProperty name');

    // fill in your formula function here:
    formula() {
        if (this.myProperty) {
            return 1;
        }
        return 0;
    }
    
    // any frequently re-used logic can be compartmentalized into functions
    nameOfFunction() {
        return 0;
    }

    /**
     * If you want to use helper functions, define them here like this
     * @returns
     */
    public buildFunctionMap(): Map<string, string> {
        return new Map([
            ['nameOfFunction', this.nameOfFunction.toString()],
        ]);
    }
}

const formula = new MyFirstFormula();
console.log('result: ');
console.log(formula.compile());