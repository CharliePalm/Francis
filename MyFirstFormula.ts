import { NotionFormulaGenerator } from './NotionFormulaGenerator';
import * as Model from './model';
class MyFirstFormula extends NotionFormulaGenerator {
    // define DB properties here:
    public myProperty = new Model.Checkbox('myProperty name');

    // fill in your formula function here:
    formula() {
        if (this.myProperty.value) {
            return 1;
        }
        return 0;
    }
    
    nameOfFunction() {
        return 0;
    }

    /**
     * If you want to use helper functions, define them here
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