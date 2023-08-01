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
        describe('function calls', () => {
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

            it('should replace nested function calls', () => {
                class FunctionTestClassWithNests extends NotionFormulaGenerator {
                    x = new Model.Number('test 1');
                    y = new Model.Text('test 2');
                    formula() {
                        if (this.format(this.x.value * this.getBetterVal()) == this.y.value) {
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
                    getBetterVal() {
                        return this.getVal() * 2;
                    }
                    public buildFunctionMap(): Map<string, string> {
                        return new Map().set('getVal', this.getVal.toString()).set('getBetterVal', this.getBetterVal.toString());
                    }
                }
                const t = new FunctionTestClassWithNests();
                t.compile();
                expect(t.tree.root.statement).toEqual('format(prop("test 1")*2*2)==prop("test 2")');
                expect(t.tree.root.trueChild.statement).toEqual('2');
            });
        });
        describe('const replacement', () => {
            class ConstTestClass extends NotionFormulaGenerator {
                x = new Model.Number('test 1');
                y = new Model.Number('test 2');
                formula() {
                    const multiplier = 10;
                    if (multiplier * this.x.value > this.y.value) {
                        return multiplier / 2;
                    } else if ((this.y.value * this.x.value) > 1 * multiplier){
                        return this.x.value * this.x.value;
                    } else {
                        return 0;
                    }
                }
            }
            it('should replace variable calls', () => {
                const t = new ConstTestClass();
                t.compile();
                expect(t.tree.root.statement).toEqual('10*prop("test 1")>prop("test 2")');
                expect(t.tree.root.trueChild.statement).toEqual('10/2');
                expect(t.tree.root.falseChild.statement).toEqual('(prop("test 2")*prop("test 1"))>1*10');
            });
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
                    } else if (this.daysTillDue.value < 20) {
                        return this.priority.value;
                    }
                    return this.priority.value / 2;
                }
            }
            
            const n = new TestClass();
            const result = n.compile();
            expect(result).toEqual('if(prop("Days Till Due")<5,prop("Priority")*prop("Days Till Due"),if(prop("Days Till Due")<10,prop("Priority")*prop("Days Till Due")/2,if(prop("Days Till Due")<20,prop("Priority"),prop("Priority")/2)))')
        });

        it.only('should create a formula with notion builtins', () => {
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

        it('should allow logic in functions', () => {
            class TestClass extends NotionFormulaGenerator {
                public status = new Model.Select('Status');
                public blocked = new Model.Checkbox('Blocked');
                formula(): any {
                    return this.round(this.getFormula());
                }
                
                getFormula(): any {
                    if (this.status.value == 'Done' || this.blocked.value) {
                        return 7 / 2;
                    } else {
                        return 7 / 3;
                    }
                }

                public buildFunctionMap(): Map<string, string> {
                    return new Map([['getFormula', this.getFormula.toString()]]);
                }
            }
            const tc = new TestClass();
            const result = tc.compile();
            expect(result).toEqual(`round(if(prop("Status")=='Done' or prop("Blocked"),7/2,7/3))`);
        });

        it('should allow multiple wrappers in a line', () => {
            class TestClass extends NotionFormulaGenerator {
                public status = new Model.Select('Status');
                public blocked = new Model.Checkbox('Blocked');
                formula(): any {
                    return this.round(this.getFormula()) + this.abs(this.getVal()) * this.log2(this.getFormula());
                }
                
                getFormula(): any {
                    if (this.status.value == 'Done' || this.blocked.value) {
                        return 7 / 2;
                    } else {
                        return 7 / 3;
                    }
                }

                getVal(): any {
                    return -10;
                }

                public buildFunctionMap(): Map<string, string> {
                    return new Map([['getFormula', this.getFormula.toString()], ['getVal', this.getVal.toString()]]);
                }
            }
            const tc = new TestClass();
            const result = tc.compile();
            expect(result).toEqual(`round(if(prop("Status")=='Done' or prop("Blocked"),7/2,7/3))+abs(-10)*log2(if(prop("Status")=='Done' or prop("Blocked"),7/2,7/3))`);
        });

        it('should allow multiple wrappers outside of the root', () => {
            class TestClass extends NotionFormulaGenerator {
                public status = new Model.Select('Status');
                public blocked = new Model.Checkbox('Blocked');
                formula(): any {
                    return this.round(this.getWrapper()) + this.abs(this.getVal()) * this.log2(this.getFormula());
                }
                
                getFormula(): any {
                    if (this.status.value == 'Done' || this.blocked.value) {
                        return 7 / 2;
                    } else {
                        return 7 / 3;
                    }
                }

                getVal(): any {
                    return -10;
                }

                getWrapper(): any {
                    if (this.blocked.value) {
                        return this.abs(this.getFormula()) + this.floor(this.getFormula());
                    } else {
                        return this.ceil(this.getFormula());
                    }
                }

                public buildFunctionMap(): Map<string, string> {
                    return new Map([
                        ['getFormula', this.getFormula.toString()], 
                        ['getVal', this.getVal.toString()], 
                        ['getWrapper', this.getWrapper.toString()]
                    ]);
                }
            }
            const tc = new TestClass();
            const result = tc.compile();
            expect(result).toEqual(`round(if(prop("Blocked"),abs(if(prop("Status")=='Done' or prop("Blocked"),7/2,7/3))+floor(if(prop("Status")=='Done' or prop("Blocked"),7/2,7/3)),ceil(if(prop("Status")=='Done' or prop("Blocked"),7/2,7/3))))+abs(-10)*log2(if(prop("Status")=='Done' or prop("Blocked"),7/2,7/3))`);
        });

        it('should allow arithmetic expressions outside of wrapper function call', () => {
            class TestClass extends NotionFormulaGenerator {
                public status = new Model.Select('Status');
                public blocked = new Model.Checkbox('Blocked');
                formula(): any {
                    return this.round(this.getFormula() * 100) / 100;
                }
                
                getFormula(): any {
                    if (this.status.value == 'Done' || this.blocked.value) {
                        return 7 / 2;
                    } else {
                        return 7 / 3;
                    }
                }

                public buildFunctionMap(): Map<string, string> {
                    return new Map([['getFormula', this.getFormula.toString()]]);
                }
            }
            const tc = new TestClass();
            const result = tc.compile();
            expect(result).toEqual(`round(if(prop("Status")=='Done' or prop("Blocked"),7/2,7/3) * 100) / 100`);
        });

        it('should work for extremely complex functions', () => {
            class ComplexFormula extends NotionFormulaGenerator {
                public dueDate = new Model.Date('Due date');
                public status = new Model.Select('Status');
                public tags = new Model.MultiSelect('Tags');
                public difficulty = new Model.Number('Difficulty');
                public blocked = new Model.Checkbox('Blocked');
                public completionPercent = new Model.Number('Completion %');
                public lastWorkedOn = new Model.Date('Last worked on');
            
                formula(): any {
                    const mult = 10;
                    if (this.status.value == 'Done' || this.blocked.value) {
                        return 0;
                    } else if (this.format(this.dueDate.value) == '') {
                        // for tasks with no real due date
                        if (this.status.value != 'In Progress') {
                            return (((this.difficulty.value + (100 / (this.completionPercent.value + 1)))) / 100) * mult;
                        } else {
                            return (((this.difficulty.value + (100 / (this.completionPercent.value + 1)))) / 100) * this.daysSinceLastWorkedOn();
                        }
                    } else if (this.dateBetween(this.dueDate.value, this.now(), 'days') <= 0) {
                        // for tasks that are overdue we need to finish them pronto
                        if (this.contains(this.tags.value, 'Must finish')) {
                            return 100 + this.difficulty.value;
                        } else {
                            return 100 - this.completionPercent.value + this.difficulty.value;
                        }
                    } else if (this.dateBetween(this.dueDate.value, this.now(), 'days') <= 7) {
                        return this.getDefaultPriority() * (7 / this.log2(this.daysTillDue()))
                    } else if (this.status.value == 'Not started') {
                        return this.getDefaultPriority() + 10;
                    }
                    return this.getDefaultPriority();
                }
            
                getDefaultPriority() {
                    return (this.round(this.difficulty.value + 100 / (this.completionPercent.value + 1)) / 2) * 
                        (this.log2(this.daysSinceLastWorkedOn() + 1) / (this.daysTillDue() + 1));
                }
            
                daysSinceLastWorkedOn() {
                    return this.dateBetween(this.now(), this.lastWorkedOn.value, 'days');
                }
            
                daysTillDue() {
                    return this.dateBetween(this.now(), this.lastWorkedOn.value, 'days');
                }
            
                buildFunctionMap(): Map<string, string> {
                    const functionMap = new Map();
                    functionMap
                        .set('getDefaultPriority', this.getDefaultPriority.toString())
                        .set('daysSinceLastWorkedOn', this.daysSinceLastWorkedOn.toString())
                        .set('daysTillDue', this.daysTillDue.toString());
                    return functionMap;
                }
            }
            const tc = new ComplexFormula();
            const result = tc.compile();
            expect(result).toEqual(`if(prop("Status")=='Done' or prop("Blocked"),0,if(format(prop("Due date"))=='',if(prop("Status")!='In Progress',(((prop("Difficulty")+(100/(prop("Completion %")+1))))/100)*10,(((prop("Difficulty")+(100/(prop("Completion %")+1))))/100)*dateBetween(now(),prop("Last worked on"),'days')),if(dateBetween(prop("Due date"),now(),'days')<=0,if(contains(prop("Tags"),'Must finish'),100+prop("Difficulty"),100-prop("Completion %")+prop("Difficulty")),if(dateBetween(prop("Due date"),now(),'days')<=7,(round(prop("Difficulty")+100/(prop("Completion %")+1))/2)*(log2(dateBetween(now(),prop("Last worked on"),'days')+1)/(dateBetween(now(),prop("Last worked on"),'days')+1))*(7/log2(dateBetween(now(),prop("Last worked on"),'days'))),if(prop("Status")=='Not started',(round(prop("Difficulty")+100/(prop("Completion %")+1))/2)*(log2(dateBetween(now(),prop("Last worked on"),'days')+1)/(dateBetween(now(),prop("Last worked on"),'days')+1))+10,(round(prop("Difficulty")+100/(prop("Completion %")+1))/2)*(log2(dateBetween(now(),prop("Last worked on"),'days')+1)/(dateBetween(now(),prop("Last worked on"),'days')+1)))))))`)
        });
    });
});
