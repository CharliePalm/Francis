[DEBUG]: DFP iteration with block: 
 if(this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Sorcerer" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Bard" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Paladin" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Warlock",this.skills.find((index, current) => (index, current) => current._valueAccessor("Tags")=="CHA")._valueAccessor("Modifier").toNumber(),if(this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Druid" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Ranger" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Cleric" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Monk",this.skills.find((index, current) => (index, current) => current._valueAccessor("Tags")=="WIS")._valueAccessor("Modifier").toNumber(),0)) 

[DEBUG]: getting children for statement: 
 if(this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Sorcerer" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Bard" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Paladin" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Warlock",this.skills.find((index, current) => (index, current) => current._valueAccessor("Tags")=="CHA")._valueAccessor("Modifier").toNumber(),if(this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Druid" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Ranger" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Cleric" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Monk",this.skills.find((index, current) => (index, current) => current._valueAccessor("Tags")=="WIS")._valueAccessor("Modifier").toNumber(),0)) 

[INFO]: returning combination children: 
 [] 

[INFO]: if block: 
 [
  'this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Sorcerer" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Bard" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Paladin" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Warlock"',
  'this.skills.find((index, current) => (index, current) => current._valueAccessor("Tags")=="CHA")._valueAccessor("Modifier").toNumber()',
  'if(this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Druid" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Ranger" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Cleric" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Monk",this.skills.find((index, current) => (index, current) => current._valueAccessor("Tags")=="WIS")._valueAccessor("Modifier").toNumber(),0)'
] 

[DEBUG]: added logic node with parent undefined: 
 Node {
  type: 'Logic',
  statement: '',
  isReverse: true,
  id: 0,
  nesting: false
} 

[DEBUG]: DFP iteration with block: 
 this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Sorcerer" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Bard" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Paladin" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Warlock" 

[DEBUG]: getting children for statement: 
 this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Sorcerer" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Bard" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Paladin" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Warlock" 

[INFO]: returning combination children: 
 [
  'this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")',
  '==',
  '"Sorcerer"',
  '||',
  'this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")',
  '==',
  '"Bard"',
  '||',
  'this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")',
  '==',
  '"Paladin"',
  '||',
  'this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")',
  '==',
  '"Warlock"'
] 

[INFO]: Classified node as return node, no further work
  

[DEBUG]: added logic node with parent 0: 
 Node {
  type: 'Return',
  statement: 'this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Sorcerer" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Bard" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Paladin" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Warlock"',
  isReverse: true,
  id: 1,
  nesting: false
} 

[DEBUG]: DFP iteration with block: 
 this.skills.find((index, current) => (index, current) => current._valueAccessor("Tags")=="CHA")._valueAccessor("Modifier").toNumber() 

[DEBUG]: getting children for statement: 
 this.skills.find((index, current) => (index, current) => current._valueAccessor("Tags")=="CHA")._valueAccessor("Modifier").toNumber() 

[INFO]: returning combination children: 
 [] 

[INFO]: Classified node as return node, no further work
  

[DEBUG]: added true node with parent 0: 
 Node {
  type: 'Return',
  statement: 'this.skills.find((index, current) => (index, current) => current._valueAccessor("Tags")=="CHA")._valueAccessor("Modifier").toNumber()',
  isReverse: true,
  id: 2,
  nesting: false
} 

[DEBUG]: DFP iteration with block: 
 if(this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Druid" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Ranger" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Cleric" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Monk",this.skills.find((index, current) => (index, current) => current._valueAccessor("Tags")=="WIS")._valueAccessor("Modifier").toNumber(),0) 

[DEBUG]: getting children for statement: 
 if(this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Druid" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Ranger" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Cleric" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Monk",this.skills.find((index, current) => (index, current) => current._valueAccessor("Tags")=="WIS")._valueAccessor("Modifier").toNumber(),0) 

[INFO]: returning combination children: 
 [] 

[INFO]: if block: 
 [
  'this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Druid" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Ranger" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Cleric" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Monk"',
  'this.skills.find((index, current) => (index, current) => current._valueAccessor("Tags")=="WIS")._valueAccessor("Modifier").toNumber()',
  '0'
] 

[DEBUG]: added false node with parent 0: 
 Node {
  type: 'Logic',
  statement: '',
  isReverse: true,
  id: 3,
  nesting: false
} 

[DEBUG]: DFP iteration with block: 
 this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Druid" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Ranger" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Cleric" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Monk" 

[DEBUG]: getting children for statement: 
 this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Druid" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Ranger" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Cleric" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Monk" 

[INFO]: returning combination children: 
 [
  'this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")',
  '==',
  '"Druid"',
  '||',
  'this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")',
  '==',
  '"Ranger"',
  '||',
  'this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")',
  '==',
  '"Cleric"',
  '||',
  'this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")',
  '==',
  '"Monk"'
] 

[INFO]: Classified node as return node, no further work
  

[DEBUG]: added logic node with parent 3: 
 Node {
  type: 'Return',
  statement: 'this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Druid" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Ranger" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Cleric" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Monk"',
  isReverse: true,
  id: 4,
  nesting: false
} 

[DEBUG]: DFP iteration with block: 
 this.skills.find((index, current) => (index, current) => current._valueAccessor("Tags")=="WIS")._valueAccessor("Modifier").toNumber() 

[DEBUG]: getting children for statement: 
 this.skills.find((index, current) => (index, current) => current._valueAccessor("Tags")=="WIS")._valueAccessor("Modifier").toNumber() 

[INFO]: returning combination children: 
 [] 

[INFO]: Classified node as return node, no further work
  

[DEBUG]: added true node with parent 3: 
 Node {
  type: 'Return',
  statement: 'this.skills.find((index, current) => (index, current) => current._valueAccessor("Tags")=="WIS")._valueAccessor("Modifier").toNumber()',
  isReverse: true,
  id: 5,
  nesting: false
} 

[DEBUG]: DFP iteration with block: 
 0 

[DEBUG]: getting children for statement: 
 0 

[INFO]: returning combination children: 
 [] 

[INFO]: Classified node as return node, no further work
  

[DEBUG]: added false node with parent 3: 
 Node {
  type: 'Return',
  statement: '0',
  isReverse: true,
  id: 6,
  nesting: false
} 

logic node:  Node {
  type: 'Return',
  statement: 'this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Sorcerer" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Bard" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Paladin" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Warlock"',
  isReverse: true,
  id: 1,
  nesting: false
}
true child:  Node {
  type: 'Return',
  statement: 'this.skills.find((index, current) => (index, current) => current._valueAccessor("Tags")=="CHA")._valueAccessor("Modifier").toNumber()',
  isReverse: true,
  id: 2,
  nesting: false
}
false child:  Node {
  type: 'Logic',
  statement: '',
  isReverse: true,
  id: 3,
  nesting: false,
  logicChild: Node {
    type: 'Return',
    statement: 'this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Druid" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Ranger" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Cleric" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Monk"',
    isReverse: true,
    id: 4,
    nesting: false
  },
  trueChild: Node {
    type: 'Return',
    statement: 'this.skills.find((index, current) => (index, current) => current._valueAccessor("Tags")=="WIS")._valueAccessor("Modifier").toNumber()',
    isReverse: true,
    id: 5,
    nesting: false
  },
  falseChild: Node {
    type: 'Return',
    statement: '0',
    isReverse: true,
    id: 6,
    nesting: false
  }
}
logic statement:  this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Sorcerer" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Bard" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Paladin" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Warlock"
logic node:  Node {
  type: 'Return',
  statement: 'this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Druid" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Ranger" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Cleric" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Monk"',
  isReverse: true,
  id: 4,
  nesting: false
}
true child:  Node {
  type: 'Return',
  statement: 'this.skills.find((index, current) => (index, current) => current._valueAccessor("Tags")=="WIS")._valueAccessor("Modifier").toNumber()',
  isReverse: true,
  id: 5,
  nesting: false
}
false child:  Node {
  type: 'Return',
  statement: '0',
  isReverse: true,
  id: 6,
  nesting: false
}
logic statement:  this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Druid" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Ranger" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Cleric" || this.classes.find((index, current) => (index, current) => current._valueAccessor("isHighestLevel"))._valueAccessor("Class")=="Monk"
[DEBUG]: replaced fns: 
 [] 

[DEBUG]: replacedFns
 [] 

final formula:  
      import { NotionFormulaGenerator } from './src/NotionFormulaGenerator';
      import * as Model from './src/model';
      class MyFirstFormula extends NotionFormulaGenerator {
          public skills = new Model.Relation('skills');
public tags = new Model.Select('tags');
public modifier = new Model.String('modifier');
public classes = new Model.Relation('classes');


          formula() {
            if (this.classes.find((index, current) => (index, current) => current._valueAccessor<any>("isHighestLevel"))._valueAccessor<any>("Class")=="Druid" || this.classes.find((index, current) => (index, current) => current._valueAccessor<any>("isHighestLevel"))._valueAccessor<any>("Class")=="Ranger" || this.classes.find((index, current) => (index, current) => current._valueAccessor<any>("isHighestLevel"))._valueAccessor<any>("Class")=="Cleric" || this.classes.find((index, current) => (index, current) => current._valueAccessor<any>("isHighestLevel"))._valueAccessor<any>("Class")=="Monk") { return this.skills.find((index, current) => (index, current) => current._valueAccessor<any>("Tags")=="WIS")._valueAccessor<any>("Modifier").toNumber()} else { return 0}}
          }

          
      }
