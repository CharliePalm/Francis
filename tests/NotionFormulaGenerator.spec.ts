import { NotionFormulaGenerator } from "../src/NotionFormulaGenerator";
import { Node } from "../src/helpers/node";
import * as Model from "../src/model";

describe('notionFormulaGenerator', () => {
    class BasicTestClass extends NotionFormulaGenerator {
        x = new Model.Text('test 1');
        y = new Model.Text('test 2');
        formula() {
            if (this.x.value == this.y.value) {
                return 0;
            }
            return 1;
        }
    }
    describe('replaceDbProperties', () => {
        it('should properly replace db props', () => {
            const testClass = new BasicTestClass();
            testClass.compile();
            expect(testClass.tree.root.logicChild.statement).toEqual('prop("test 1")==prop("test 2")')
        });

        it('should replace _valueAccessor calls', () => {
            class AccessorClass extends NotionFormulaGenerator {
                public myRelation = new Model.Relation('myRelation');
                formula() {
                    return this.myRelation.at(0)._valueAccessor('Value');
                }
            }
            const testClass = new AccessorClass();
            expect(testClass.compile()).toEqual('prop("myRelation").at(0).prop("Value")');
        });

        it('should replace _valueAccessor calls with type argument', () => {
            class AccessorClass extends NotionFormulaGenerator {
                public myRelation = new Model.Relation('myRelation');
                formula() {
                    return this.myRelation.at(0)._valueAccessor<Model.NotionNumber>('Value').abs();
                }
            }
            const testClass = new AccessorClass();
            expect(testClass.compile()).toEqual('prop("myRelation").at(0).prop("Value").abs()');
        });
    });

    describe('catchFallThroughElse', () => {
        it('should append else to a fallthrough if', () => {
            const inp = 'if(1+1){1}elseif(2+2){2}4'
            expect(NotionFormulaGenerator['catchFallThroughElse'](inp)).toEqual('if(1+1){1}elseif(2+2){2}else{4}')
        });

        it('should append else to a nested if', () => {
            const inp = 'if(1+1){if(1){2}0}else{4}'
            expect(NotionFormulaGenerator['catchFallThroughElse'](inp)).toEqual('if(1+1){if(1){2}else{0}}else{4}')
        });

        it('should append else to a nested if and fallthrough if', () => {
            const inp = 'if(1+1){if(1){2}0}4'
            expect(NotionFormulaGenerator['catchFallThroughElse'](inp)).toEqual('if(1+1){if(1){2}else{0}}else{4}')
        });

        it('should not add unnecessary else blocks to logic in functions', () => {
            const inp = 'this.round((if(this.status.value=="Done"||this.blocked.value){7/2}else{7/3}))';
            expect(NotionFormulaGenerator['catchFallThroughElse'](inp)).toEqual('this.round((if(this.status.value=="Done"||this.blocked.value){7/2}else{7/3}))')
        });

        it('should handle parentheses in fallthrough blocks', () => {
            const inp = 'this.round((if(this.status.value=="Done"||this.blocked.value){7/2}e()))';
            expect(NotionFormulaGenerator['catchFallThroughElse'](inp)).toEqual('this.round((if(this.status.value=="Done"||this.blocked.value){7/2}else{e()}))')
        });

        it('should handle string returns in fallthrough blocks', () => {
            const inp = 'this.round((if(this.status.value=="Done"||this.blocked.value){7/2}"hello"))';
            expect(NotionFormulaGenerator['catchFallThroughElse'](inp)).toEqual('this.round((if(this.status.value=="Done"||this.blocked.value){7/2}else{"hello"}))')
        });

        it('should handle open parentheses as the first char in a fall through', () => {
            const inp = 'if(this.status.value=="Done"||this.blocked.value){7/2}((this.round(this.difficulty.value+100/(this.completionPercent.value+1))/2)*(this.log2(this.dateBetween(this.now(),this.lastWorkedOn.value,"days")+1)/(this.dateBetween(this.now(),this.lastWorkedOn.value,"days")+1)))';
            expect(NotionFormulaGenerator['catchFallThroughElse'](inp)).toEqual('if(this.status.value=="Done"||this.blocked.value){7/2}else{((this.round(this.difficulty.value+100/(this.completionPercent.value+1))/2)*(this.log2(this.dateBetween(this.now(),this.lastWorkedOn.value,"days")+1)/(this.dateBetween(this.now(),this.lastWorkedOn.value,"days")+1)))}')
        });
    });

    describe('base functionality', () => {
        class BlankTestClass extends NotionFormulaGenerator {
            formula() {
                return 0;
            }
        }
        it('should correctly parse a base return statement', () => {
            const t = new BlankTestClass();
            const result = t.compile();
            expect(result).toEqual('0');
        });

        it('should allow simple arithmetic', () => {
            class TestClass extends NotionFormulaGenerator {
                formula() {
                    return 3 + 10 * 4 - 1;
                }
            }
            const tc = new TestClass();
            const result = tc.compile();
            expect(result).toEqual(`3+10*4-1`);
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
                getVal() { return 2; }
                public buildFunctionMap(): Map<string, string> {
                    return new Map().set('getVal', this.getVal.toString());
                }
            }
            it('should replace function calls', () => {
                const t = new FunctionTestClass();
                const result = t.compile();
                expect(t.tree.root.logicChild.statement).toEqual('format(prop("test 1")*(2))==prop("test 2")');
                expect(t.tree.root.trueChild.statement).toEqual('()');
                expect(t.tree.root.trueChild.type).toEqual(Model.NodeType.Wrapper);
                expect(t.tree.root.trueChild.children).toHaveLength(1);
                expect(t.tree.root.trueChild.children[0].statement).toEqual('2');
            });

            it('should replace nested function calls and wrap them in parentheses', () => {
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
                const result = t.compile();
                expect(t.tree.root.logicChild.statement).toEqual('format(prop("test 1")*(2*2))==prop("test 2")');
                expect(t.tree.root.trueChild.statement).toEqual('()');
                expect(t.tree.root.trueChild.type).toEqual(Model.NodeType.Wrapper);
                expect(t.tree.root.trueChild.children).toHaveLength(1);
                expect(t.tree.root.trueChild.children[0].statement).toEqual('2');
                expect(result).toEqual('if(format(prop("test 1")*(2*2))==prop("test 2"),(2),if(((2)*prop("test 1"))>1,(2)*prop("test 1"),0))')
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
                expect(t.tree.root.logicChild.statement).toEqual('10*prop("test 1")>prop("test 2")');
                expect(t.tree.root.trueChild.statement).toEqual('10/2');
                expect(t.tree.root.falseChild.logicChild.statement).toEqual('(prop("test 2")*prop("test 1"))>1*10');
                expect(t.tree.root.falseChild.trueChild.statement).toEqual('prop("test 1")*prop("test 1")');
                expect(t.tree.root.falseChild.falseChild.statement).toEqual('0');
            });
        });

        describe('complex return statements', () => {
            it('should handle valueAccessor chains', () => {
                class AccessorClass extends NotionFormulaGenerator {
                    public myRelation = new Model.Relation('myRelation');
                    formula() {
                        return this.myRelation.at(0)._valueAccessor<Model.NotionString>('Value').toNumber().value;
                    }
                }
                const testClass = new AccessorClass();
                expect(testClass.compile()).toEqual('prop("myRelation").at(0).prop("Value").toNumber()');
            });

            it('should handle callbacks in returns', () => {
                class AccessorClass extends NotionFormulaGenerator {
                    public myRelation = new Model.Relation('myRelation');
                    formula() {
                        return this.myRelation.find((v) => v._valueAccessor<Model.NotionString>('innerProp').value === 'test')._valueAccessor<Model.NotionString>('Value').toNumber().value;
                    }
                }
                const testClass = new AccessorClass();
                expect(testClass.compile()).toEqual('prop("myRelation").find(current.prop("innerProp")=="test").prop("Value").toNumber()');
            });
        });
    });

    describe('replace functions', () => {
        it('should replace this.* in statement', () => {
            const n = new Node(Model.NodeType.Logic, 'this.dateBetween(prop("test"), prop("test2"), "days")');
            n.replaceFunctionsAndOperators();
            expect(n.statement).toEqual('dateBetween(prop("test"), prop("test2"), "days")');
        });

        it('should replace multiple this.*s in statement', () => {
            const n = new Node(Model.NodeType.Logic, 'this.dateBetween(prop("test"), prop("test2"), "days") != this.floor(5.5)');
            n.replaceFunctionsAndOperators();
            expect(n.statement).toEqual('dateBetween(prop("test"), prop("test2"), "days") != floor(5.5)');
        });

        it('should replace && operator', () => {
            const n = new Node(Model.NodeType.Logic, 'prop("test2"),"days")!=this.floor(5.5)&&1&&3');
            n.replaceFunctionsAndOperators();
            expect(n.statement).toEqual('prop("test2"),"days")!=floor(5.5) and 1 and 3');
        });

        it('should replace || operator', () => {
            const n = new Node(Model.NodeType.Logic, 'prop("test2"),"days")!=this.floor(5.5)||1||3');
            n.replaceFunctionsAndOperators();
            expect(n.statement).toEqual('prop("test2"),"days")!=floor(5.5) or 1 or 3');
        });

        it('should replace ! operator', () => {
            const n = new Node(Model.NodeType.Logic, 'prop("test2"),"days")!=this.floor(5.5)&&!false||!true||3!=!1');
            n.replaceFunctionsAndOperators();
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
            expect(n.compile()).toEqual(`if(prop("Days Till Due")<5,prop("Priority")*prop("Days Till Due"),if(prop("Days Till Due")<10,prop("Priority")*prop("Days Till Due")/2,if(prop("Days Till Due")<20,prop("Priority"),prop("Priority")/2)))`)
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
                formula() {
                    if (this.status.value == 'Done' || this.blocked.value) {
                        return 0;
                    } else if (this.dateBetween(this.dueDate.value, this.now(), 'days') <= 0) {
                        return 100;
                    } else if (this.status.value == 'Not started') {
                        return (this.difficulty.value) * (
                            this.pi() / 
                            this.dateBetween(
                                this.dateAdd(this.dueDate.value, 1, 'days'), 
                                this.now(), 
                                'days'
                            )
                        );
                    } else {
                        return this.dateBetween(this.lastWorkedOn.value, this.now(), 'days') * (this.difficulty.value / (100 + this.e()) + this.e())
                    }
                }
            }
            const tc = new TestClass();
            const result = tc.compile();
            expect(result).toEqual(`if(prop("Status")=="Done" or prop("Blocked"),0,if(dateBetween(prop("Due date"),now(),"days")<=0,100,if(prop("Status")=="Not started",(prop("Difficulty"))*(pi()/dateBetween(dateAdd(prop("Due date"),1,"days"),now(),"days")),dateBetween(prop("Last worked on"),now(),"days")*(prop("Difficulty")/(100+e())+e()))))`)
        });

        describe('function calls in if statements', () => {
            it('allows function calls in if statements', () => {
                class TestClass extends NotionFormulaGenerator {
                    public status = new Model.Select('Status');
                    formula() {
                        if (this.getFormula() > 1) {
                            return 'hello';
                        }
                        return 'world';
                    }
                    
                    getFormula() {
                        if (1 == 1) {
                            return 1;
                        } else {
                            return 2;
                        }
                    }
    
                    public buildFunctionMap(): Map<string, string> {
                        return new Map([['getFormula', this.getFormula.toString()]]);
                    }
                }
    
                const t = new TestClass();
                expect(t.compile()).toEqual('if((if(1==1,1,2))>1,"hello","world")');
            });
    
            it('allows multiple function calls in if statements', () => {
                class TestClass extends NotionFormulaGenerator {
                    public status = new Model.Select('Status');
                    formula() {
                        if (this.getFormula() + this.getFormula() == 1) {
                            return 'hello';
                        }
                        return 'world';
                    }
                    
                    getFormula() {
                        if (1 == 1) {
                            return 1;
                        } else {
                            return 2;
                        }
                    }
    
                    public buildFunctionMap(): Map<string, string> {
                        return new Map([['getFormula', this.getFormula.toString()]]);
                    }
                }
    
                const t = new TestClass();
                expect(t.compile()).toEqual('if((if(1==1,1,2))+(if(1==1,1,2))==1,"hello","world")');
            });
    
            it('allows multiple function calls in combination in if blocks', () => {
                class TestClass extends NotionFormulaGenerator {
                    public status = new Model.Select('Status');
                    formula() {
                        if (this.getFormula() + 4 + this.getFormula() == 1) {
                            return 'hello';
                        }
                        return 'world';
                    }
                    
                    getFormula() {
                        if (1 == 1) {
                            return 1;
                        } else {
                            return 2;
                        }
                    }
    
                    public buildFunctionMap(): Map<string, string> {
                        return new Map([['getFormula', this.getFormula.toString()]]);
                    }
                }
    
                const t = new TestClass();
                expect(t.compile()).toEqual('if((if(1==1,1,2))+4+(if(1==1,1,2))==1,"hello","world")');
            });
    
            it('allows noses before logic in if blocks', () => {
                class TestClass extends NotionFormulaGenerator {
                    public status = new Model.Select('Status');
                    formula() {
                        if (1 + this.getFormula() + 4 + this.getFormula() == 1) {
                            return 'hello';
                        }
                        return 'world';
                    }
                    
                    getFormula() {
                        if (1 == 1) {
                            return 1;
                        } else {
                            return 2;
                        }
                    }
    
                    public buildFunctionMap(): Map<string, string> {
                        return new Map([['getFormula', this.getFormula.toString()]]);
                    }
                }
    
                const t = new TestClass();
                expect(t.compile()).toEqual('if(1+(if(1==1,1,2))+4+(if(1==1,1,2))==1,"hello","world")');
            });

            it('allows if blocks with function calls and multiple operators', () => {
                class TestClass extends NotionFormulaGenerator {
                    public status = new Model.Select('Status');
                    formula() {
                        if (this.getFormula() == 1 || this.getFormula() < 2) {
                            return 'hello';
                        }
                        return 'world';
                    }
                    
                    getFormula() {
                        if (1 == 1) {
                            return 1;
                        } else {
                            return 2;
                        }
                    }
    
                    public buildFunctionMap(): Map<string, string> {
                        return new Map([['getFormula', this.getFormula.toString()]]);
                    }
                }
    
                const t = new TestClass();
                expect(t.compile()).toEqual('if((if(1==1,1,2))==1 or (if(1==1,1,2))<2,"hello","world")');
            });

            it('allows if blocks with function calls and multiple operators', () => {
                class TestClass extends NotionFormulaGenerator {
                    public status = new Model.Select('Status');
                    formula() {
                        if (1 + this.getFormula() + 4 + this.getFormula() == 1 || this.getFormula() < 2 + 2 * this.getFormula()) {
                            return 'hello';
                        }
                        return 'world';
                    }
                    
                    getFormula() {
                        if (1 == 1) {
                            return 1;
                        } else {
                            return 2;
                        }
                    }
    
                    public buildFunctionMap(): Map<string, string> {
                        return new Map([['getFormula', this.getFormula.toString()]]);
                    }
                }
    
                const t = new TestClass();
                expect(t.compile()).toEqual('if(1+(if(1==1,1,2))+4+(if(1==1,1,2))==1 or (if(1==1,1,2))<2+2*(if(1==1,1,2)),"hello","world")');
            });
        });

        describe('combination nodes', () => {
            it('should allow arithmetic expressions between function calls', () => {
                class TestClass extends NotionFormulaGenerator {
                    public status = new Model.Select('Status');
                    formula() {
                        return this.getFormula() + this.f2();
                    }
                    
                    getFormula() {
                        if (this.status.value == 'Done') {
                            return 1;
                        } else {
                            return 2;
                        }
                    }
                    f2() { 
                        if (this.status.value != 'Done') {
                            return 3;
                        } else {
                            return 4;
                        }
                    }
    
                    public buildFunctionMap(): Map<string, string> {
                        return new Map([['getFormula', this.getFormula.toString()], ['f2', this.f2.toString()]]);
                    }
                }
                const tc = new TestClass();
                const result = tc.compile();
                expect(result).toEqual(`(if(prop("Status")=="Done",1,2))+(if(prop("Status")!="Done",3,4))`);
            });
        });

        describe('simple combinations', () => {
            it('should allow arithmetic expressions outside of wrapper function call', () => {
                class TestClass extends NotionFormulaGenerator {
                    public status = new Model.Select('Status');
                    public blocked = new Model.Checkbox('Blocked');
                    formula() {
                        return this.round(this.getFormula() * 100) / 100;
                    }
                    
                    getFormula() {
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
                expect(result).toEqual(`round((if(prop("Status")=="Done" or prop("Blocked"),7/2,7/3))*100)/100`);
            });
    
            it('should allow arithmetic expressions (noses) before calling functions', () => {
                class TestClass extends NotionFormulaGenerator {
                    public status = new Model.Select('Status');
                    public blocked = new Model.Checkbox('Blocked');
                    formula() {
                        return 3 + this.getFormula();
                    }
                    
                    getFormula() {
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
                expect(result).toEqual(`3+(if(prop("Status")=="Done" or prop("Blocked"),7/2,7/3))`);
            });
    
            it('should allow noses before multiple function calls', () => {
                class TestClass extends NotionFormulaGenerator {
                    public status = new Model.Select('Status');
                    formula() {
                        return 1 + this.getFormula() + this.getFormula();
                    }
                    
                    getFormula() {
                        if (this.status.value == 'Done') {
                            return 1;
                        } else {
                            return 2;
                        }
                    }
    
                    public buildFunctionMap(): Map<string, string> {
                        return new Map([['getFormula', this.getFormula.toString()]]);
                    }
                }
                const tc = new TestClass();
                const result = tc.compile();
                expect(result).toEqual(`1+(if(prop("Status")=="Done",1,2))+(if(prop("Status")=="Done",1,2))`);
            });
    
            it('should allow tails and noses before and after multiple function calls', () => {
                class TestClass extends NotionFormulaGenerator {
                    public status = new Model.Select('Status');
                    formula() {
                        return 1 + this.getFormula() + this.getFormula() + 3;
                    }
                    
                    getFormula() {
                        if (this.status.value == 'Done') {
                            return 1;
                        } else {
                            return 2;
                        }
                    }
    
                    public buildFunctionMap(): Map<string, string> {
                        return new Map([['getFormula', this.getFormula.toString()]]);
                    }
                }
                const tc = new TestClass();
                const result = tc.compile();
                expect(result).toEqual(`1+(if(prop("Status")=="Done",1,2))+(if(prop("Status")=="Done",1,2))+3`);
            });    
        });
        
        it('should create a formula using object style function calls', () => {
            class TestClass extends NotionFormulaGenerator {
                public testProp = new Model.MultiSelect('Test Property');
                public dateProp = new Model.Date('date');
                public formula(): Model.NotionDate {
                    if (this.testProp.includes('test')) {
                        return this.dateProp.dateAdd(1, 'days');
                    }
                    return this.now();
                }
            }
            const tc = new TestClass();
            const result = tc.compile();
            expect(result).toEqual('if(prop("Test Property").includes("test"),prop("date").dateAdd(1,"days"),now())');
        });

        describe('primitive compare replaces', () => {
            it('replaces the .value for primitive comparisons', () => {
                class TestClass extends NotionFormulaGenerator {
                    public testProp = new Model.Text('Test Property');
                    public dateProp = new Model.Date('date');
                    public formula() {
                        return this.testProp.upper().value == 'test' ? 1 : (this.testProp.upper() == this.dateProp.format());
                    }
                }
                const tc = new TestClass();
                const result = tc.compile();
                expect(result).toEqual('prop("Test Property").upper()=="test"?1:(prop("Test Property").upper()==prop("date").format())');
            });
        });

        describe('properties as parameters', () => {
            it('allows property references with no .value', () => {
                class TestClass extends NotionFormulaGenerator {
                    public t1 = new Model.Text('t1');
                    public t2 = new Model.Text('t2');
                    public formula() {
                        return this.t1.contains(this.t2);
                    }
                }
                const tc = new TestClass();
                const result = tc.compile();
                expect(result).toEqual('prop("t1").contains(prop("t2"))');
            });
        });

        describe('callbacks', () => {
            it('should replace function calls that use a callback parameter', () => {
                class TestClass extends NotionFormulaGenerator {
                    public testProp = new Model.MultiSelect<Model.NotionString>('Test Property');
                    public dateProp = new Model.Date('date');
                    public formula(): Model.NotionDate {
                        if (this.testProp.map((index, current) => current.upper()).includes('test')) {
                            return this.dateProp.dateAdd(1, 'days');
                        }
                        return this.now();
                    }
                }
                const tc = new TestClass();
                const result = tc.compile();
                expect(result).toEqual('if(prop("Test Property").map(current.upper()).includes("test"),prop("date").dateAdd(1,"days"),now())');
            });

            it('should replace function calls that use a callback parameter and unexpected variables', () => {
                class TestClass extends NotionFormulaGenerator {
                    public testProp = new Model.MultiSelect('Test Property');
                    public dateProp = new Model.Date('date');
                    public formula(): Model.NotionDate {
                        if (this.testProp.map((index, current) => (this.concat(current.lower(), index.format()))).includes('test')) {
                            return this.dateProp.dateAdd(1, 'days');
                        }
                        return this.now();
                    }
                }
                const tc = new TestClass();
                const result = tc.compile();
                expect(result).toEqual(`if(prop("Test Property").map((concat(current.lower(),index.format()))).includes("test"),prop("date").dateAdd(1,"days"),now())`);
            });

            it('allows typing callback parameters as primitives or objects', () => {
                class TestClass extends NotionFormulaGenerator {
                    public f = new Model.Formula<Model.NotionList<Model.Text>>('formula');
                    public blocked = new Model.Checkbox('Blocked');
                    formula() {
                        return this.blocked.value ?
                            this.f.value.map((a: Model.NotionNumber, b: Model.Text) => a.value + b.toNumber().value) :
                            this.f.value.map((a: number, b: string) => b == 'test' ? a == 1 : a == 2);
                    }
                }
                const tc = new TestClass();
                const result = tc.compile();
                expect(result).toEqual(`prop("Blocked")?prop("formula").map(index+current.toNumber()):prop("formula").map(current=="test"?index==1:index==2)`);
            });
            
            // it('allows functions in callbacks', () => {
            //     class TestClass extends NotionFormulaGenerator {
            //         public class = new Model.Relation('Class');
            //         public skills = new Model.Relation('Skills');
            //         formula() {
            //             if (this.getClass() === 'Wizard' || this.getClass() === 'Artificer') {
            //                 return this.skills.find((s) => s._valueAccessor('Tags') === 'INT')._valueAccessor<Model.NotionString>('Modifier').toNumber().value;
            //             }
            //             return 0;
            //         }

            //         getClass() {
            //             return this.class.at(0)._valueAccessor<Model.NotionString>('Value').value;
            //         }

            //         public buildFunctionMap(): Map<string, string> {
            //             return new Map([
            //                 ['getClass', this.getClass.toString()],
            //             ]);
            //         }
            //     }
            //     const c = new TestClass();
            //     expect(c.compile()).toEqual('')
            // });
        });

        it('should allow logic in functions', () => {
            class TestClass extends NotionFormulaGenerator {
                public status = new Model.Select('Status');
                public blocked = new Model.Checkbox('Blocked');
                formula() {
                    return this.round(this.getFormula());
                }
                
                getFormula() {
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
            expect(result).toEqual(`round((if(prop("Status")=="Done" or prop("Blocked"),7/2,7/3)))`);
        });

        it('should allow nested wrapper function call with no logic', () => {
            class TestClass extends NotionFormulaGenerator {
                public dueDate = new Model.Date('Due date');
            
                formula() {
                    return this.round(this.buildFormula());
                }
            
                buildFormula() {
                    return this.daysTillDue();
                }
            
                daysTillDue() {
                    return this.dateBetween(this.now(), this.dueDate.value, 'days');
                }
            
                buildFunctionMap(): Map<string, string> {
                    return new Map([
                        ['daysTillDue', this.daysTillDue.toString()],
                        ['buildFormula', this.buildFormula.toString()],
                    ]);
                }
            }
            const tc = new TestClass();
            const result = tc.compile();
            expect(result).toEqual(`round((dateBetween(now(),prop("Due date"),"days")))`);
        });

        it('should allow multiple wrappers in a line', () => {
            class TestClass extends NotionFormulaGenerator {
                public status = new Model.Select('Status');
                public blocked = new Model.Checkbox('Blocked');
                formula() {
                    return this.round(this.getFormula()) + this.abs(this.getVal()) * this.log2(this.getFormula());
                }
                
                getFormula() {
                    if (this.status.value == 'Done' || this.blocked.value) {
                        return 7 / 2;
                    } else {
                        return 7 / 3;
                    }
                }

                getVal() {
                    return -10;
                }

                public buildFunctionMap(): Map<string, string> {
                    return new Map([['getFormula', this.getFormula.toString()], ['getVal', this.getVal.toString()]]);
                }
            }
            const tc = new TestClass();
            const result = tc.compile();
            expect(result).toEqual(`round((if(prop("Status")=="Done" or prop("Blocked"),7/2,7/3)))+abs((-10))*log2((if(prop("Status")=="Done" or prop("Blocked"),7/2,7/3)))`);
        });

        it('should allow multiple wrappers outside of the root', () => {
            class TestClass extends NotionFormulaGenerator {
                public status = new Model.Select('Status');
                public blocked = new Model.Checkbox('Blocked');
                formula() {
                    return this.round(this.getWrapper()) + this.abs(this.getVal()) * this.log2(this.getFormula());
                }
                
                getFormula() {
                    if (this.status.value == 'Done' || this.blocked.value) {
                        return 7 / 2;
                    } else {
                        return 7 / 3;
                    }
                }

                getVal() {
                    return -10;
                }

                getWrapper() {
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
            expect(result).toEqual(`round((if(prop("Blocked"),abs(if(prop("Status")=="Done" or prop("Blocked"),7/2,7/3))+floor(if(prop("Status")=="Done" or prop("Blocked"),7/2,7/3)),ceil(if(prop("Status")=="Done" or prop("Blocked"),7/2,7/3)))))+abs((-10))*log2((if(prop("Status")=="Done" or prop("Blocked"),7/2,7/3)))`);
        });

        it('handles formula types properly', () => {
            class TestClass extends NotionFormulaGenerator {
                public f = new Model.Formula<Model.NotionList<Model.Text>>('formula');
                public blocked = new Model.Checkbox('Blocked');
                formula() {
                    return this.f.value.map((a, b) => a.value == this.f.value.length().value - 1 ? 'last value of list' : b.lower());
                }
            }
            const tc = new TestClass();
            const result = tc.compile();
            expect(result).toEqual(`prop("formula").map(index==prop("formula").length()-1?"last value of list":current.lower())`);
        });

        it('should handle nested tails', () => {
            class TestClass extends NotionFormulaGenerator {
                public status = new Model.Select('Status');
                public blocked = new Model.Checkbox('Blocked');
                formula() {
                    return this.round(this.abs(this.getFormula() - 10) * 100) / 100;
                }
                
                getFormula() {
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
            expect(result).toEqual(`round(abs((if(prop("Status")=="Done" or prop("Blocked"),7/2,7/3))-10)*100)/100`);
        });

        it('should work for extremely complex functions', () => {
            class ComplexFormula extends NotionFormulaGenerator {
                public dueDate = new Model.Date('Due date');
                public status = new Model.Select('Status');
                public tags = new Model.MultiSelect<Model.NotionString>('Tags');
                public difficulty = new Model.Number('Difficulty');
                public blocked = new Model.Checkbox('Blocked');
                public completionPercent = new Model.Number('Completion %');
                public lastWorkedOn = new Model.Date('Last worked on');
            
                formula() {
                    const multiplier = 10;
                    if (this.status.value == 'Done' || this.blocked.value) {
                        return 0;
                    } else if (this.format(this.dueDate.value) == '') {
                        // for tasks with no real due date
                        if (this.status.value != 'In Progress') {
                            return (((this.difficulty.value + (100 / (this.completionPercent.value + 1)))) / 100) * multiplier;
                        } else {
                            return (((this.difficulty.value + (100 / (this.completionPercent.value + 1)))) / 100) * this.daysSinceLastWorkedOn();
                        }
                    } else if (this.dateBetween(this.dueDate.value, this.now(), 'days') <= 0) {
                        // for tasks that are overdue we need to finish them pronto
                        if (this.contains(this.tags, 'Must finish')) {
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
            expect(result).toEqual(`if(prop(\"Status\")==\"Done\" or prop(\"Blocked\"),0,if(format(prop(\"Due date\"))==\"\",if(prop(\"Status\")!=\"In Progress\",(((prop(\"Difficulty\")+(100/(prop(\"Completion %\")+1))))/100)*10,(((prop(\"Difficulty\")+(100/(prop(\"Completion %\")+1))))/100)*(dateBetween(now(),prop(\"Last worked on\"),\"days\"))),if(dateBetween(prop(\"Due date\"),now(),\"days\")<=0,if(contains(prop(\"Tags\"),\"Must finish\"),100+prop(\"Difficulty\"),100-prop(\"Completion %\")+prop(\"Difficulty\")),if(dateBetween(prop(\"Due date\"),now(),\"days\")<=7,((round(prop(\"Difficulty\")+100/(prop(\"Completion %\")+1))/2)*(log2(dateBetween(now(),prop(\"Last worked on\"),\"days\")+1)/(dateBetween(now(),prop(\"Last worked on\"),\"days\")+1)))*(7/log2((dateBetween(now(),prop(\"Last worked on\"),\"days\")))),if(prop(\"Status\")==\"Not started\",((round(prop(\"Difficulty\")+100/(prop(\"Completion %\")+1))/2)*(log2(dateBetween(now(),prop(\"Last worked on\"),\"days\")+1)/(dateBetween(now(),prop(\"Last worked on\"),\"days\")+1)))+10,((round(prop(\"Difficulty\")+100/(prop(\"Completion %\")+1))/2)*(log2(dateBetween(now(),prop(\"Last worked on\"),\"days\")+1)/(dateBetween(now(),prop(\"Last worked on\"),\"days\")+1))))))))`)
        });
    });
});
