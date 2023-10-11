import { NotionFormulaGenerator } from "./NotionFormulaGenerator";
import * as Model from './model';

class TestClass extends NotionFormulaGenerator {
    public tags = new Model.MultiSelect('Tags');
    public formula(): number {
        if (this.tags.)
        return this.priority.value / 2;
    }
}