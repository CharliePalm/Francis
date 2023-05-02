import { NotionFormulaGenerator } from "../NotionFormulaGenerator";
import { Node } from '../helpers/tree';
import * as Model from "../model";

describe('notionFormulaGenerator', () => {
    class BasicTestClass extends NotionFormulaGenerator {
        x = new Model.Text('test 1');
        y = new Model.Text('test 2');
        formula() {
            if (this.x.value == this.y.value) {
                return 0;
            } else {
                return 1;
            }
        }
    }
    describe('replaceDbProperties', () => {
        it('should properly replace db props', () => {
            const testClass = new BasicTestClass();
            const result = testClass.compile();
            expect(testClass.tree.root.statement).toEqual('prop("test 1")==prop("test 2")')
        });
    });

    describe('initial replacement', () => {
        class FunctionTestClass extends NotionFormulaGenerator {
            x = new Model.Number('test 1');
            y = new Model.Text('test 2');
            formula() {
                if (this.format(this.x.value * this.getVal()) == this.y.value) {
                    return this.getVal();
                } else if ((this.getVal() * this.x.value) > 1){
                    return this.getVal() * this.x.value;
                } else {
                    return 0;
                }
            }
            getVal() {
                return 2;
            }
            public buildFunctionMap(): Map<string, string> {
                return new Map().set('getVal', this.getVal.toString());
            }
        }
        it('should replace function calls', () => {
            const t = new FunctionTestClass();
            t.compile();
            expect(t.tree.root.statement).toEqual('format(prop("test 1")*2)==prop("test 2")');
            expect(t.tree.root.trueChild.statement).toEqual('2');
        });
    });

    describe('replace functions', () => {
        it('should replace this.* in statement', () => {
            const n = new Node(Model.NodeType.Logic, 'this.dateBetween(prop("test"), prop("test2"), "days")');
            const testClass = new BasicTestClass();
            testClass.replaceFunctionsAndOperators(n);
            expect(n.statement).toEqual('dateBetween(prop("test"), prop("test2"), "days")');
        });

        it('should replace multiple this.*s in statement', () => {
            const n = new Node(Model.NodeType.Logic, 'this.dateBetween(prop("test"), prop("test2"), "days") != this.floor(5.5)');
            const testClass = new BasicTestClass();
            testClass.replaceFunctionsAndOperators(n);
            expect(n.statement).toEqual('dateBetween(prop("test"), prop("test2"), "days") != floor(5.5)');
        });

        it('should replace && operator', () => {
            const n = new Node(Model.NodeType.Logic, 'prop("test2"),"days")!=this.floor(5.5)&&1&&3');
            const testClass = new BasicTestClass();
            testClass.replaceFunctionsAndOperators(n);
            expect(n.statement).toEqual('prop("test2"),"days")!=floor(5.5) and 1 and 3');
        });

        it('should replace || operator', () => {
            const n = new Node(Model.NodeType.Logic, 'prop("test2"),"days")!=this.floor(5.5)||1||3');
            const testClass = new BasicTestClass();
            testClass.replaceFunctionsAndOperators(n);
            expect(n.statement).toEqual('prop("test2"),"days")!=floor(5.5) or 1 or 3');
        });

        it('should replace ! operator', () => {
            const n = new Node(Model.NodeType.Logic, 'prop("test2"),"days")!=this.floor(5.5)&&!false||!true||3!=!1');
            const testClass = new BasicTestClass();
            testClass.replaceFunctionsAndOperators(n);
            expect(n.statement).toEqual('prop("test2"),"days")!=floor(5.5) and  not false or  not true or 3!= not 1');
        });
    });
    
    describe('e2e', () => {
        it('should create formula', () => {
            class TestClass extends NotionFormulaGenerator {
                public daysTillDue = new Model.Number('Days Till Due');
                public priority = new Model.Number('Priority');
                public formula(): number {
                    if (this.daysTillDue.value < 5) {
                        return this.priority.value * this.daysTillDue.value;
                    } else if (this.daysTillDue.value < 10) {
                        return this.priority.value * this.daysTillDue.value / 2;
                    } else {
                        return this.priority.value;
                    }
                }
            }
            
            const n = new TestClass();
            const result = n.compile();
            expect(result).toEqual('if(prop("Days Till Due")<5,prop("Priority")*prop("Days Till Due"),if(prop("Days Till Due")<10,prop("Priority")*prop("Days Till Due")/2,prop("Priority")))')
        });

        it('should create a formula with notion builtins', () => {
            class TestClass extends NotionFormulaGenerator {
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
                        return (this.difficulty.value) * (
                            this.pi / 
                            this.dateBetween(
                                this.dateAdd(this.dueDate.value, 1, 'days'), 
                                this.now(), 
                                'days'
                            )
                        );
                    } else {
                        return this.dateBetween(this.lastWorkedOn.value, this.now(), 'days') * (this.difficulty.value / (100 + this.e) + this.e)
                    }
                }
            }
            const tc = new TestClass();
            const result = tc.compile();
            expect(result).toEqual(`if(prop("Status")=='Done' or prop("Blocked"),0,if(dateBetween(prop("Due date"),now(),'days')<=0,100,if(prop("Status")=='Not started',(prop("Difficulty"))*(pi/dateBetween(dateAdd(prop("Due date"),1,'days'),now(),'days')),dateBetween(prop("Last worked on"),now(),'days')*(prop("Difficulty")/(100+e)+e))))`)
        });
    });
});
