import { ReverseTree } from '../src/helpers/reverseTree';
import { NodeType } from '../src/model';

describe('reverseTree', () => {
  let tree: ReverseTree;
  beforeEach(() => {
    tree = new ReverseTree();
  });
  describe('wrapper', () => {
    it('should handle a simple wrapper', async () => {
      const formula = 'this.round(if(this.myProperty,1,0))';
      tree.dfp(formula);
      expect(tree.root.type).toEqual(NodeType.Wrapper);
      expect(tree.root.statement).toEqual('this.round()');

      expect(tree.root.wrappedChildren[0].type).toEqual(NodeType.Logic);
      expect(tree.root.wrappedChildren.length).toEqual(1);
      expect(tree.root.wrappedChildren[0].statement).toEqual('');
      const logicNode = tree.root.wrappedChildren[0];
      expect(logicNode.logicChild.statement).toEqual('this.myProperty');
      expect(logicNode.trueChild.statement).toEqual('1');
      expect(logicNode.falseChild.statement).toEqual('0');
    });
  });

  describe('logic', () => {
    it('should handle a simple logic statement', () => {
      const formula = 'if(this.myProperty,1,0)';
      tree.dfp(formula);
      expect(tree.root.type).toEqual(NodeType.Logic);
      expect(tree.root.statement).toEqual('');
      expect(tree.root.logicChild.statement).toEqual('this.myProperty');
      expect(tree.root.trueChild.statement).toEqual('1');
      expect(tree.root.falseChild.statement).toEqual('0');
    });

    it('should handle a simple logic statement with properties in true/false children', () => {
      const formula = 'if(this.myProperty,this.myProperty+1,this.myProperty-1)';
      tree.dfp(formula);
      expect(tree.root.type).toEqual(NodeType.Logic);
      expect(tree.root.statement).toEqual('');
      expect(tree.root.logicChild.statement).toEqual('this.myProperty');
      expect(tree.root.trueChild.statement).toEqual('this.myProperty+1');
      expect(tree.root.falseChild.statement).toEqual('this.myProperty-1');
    });
  });

  describe('string parsing', () => {
    it('should pull off start and end parentheses if present', () => {
      const formula = 'if(((this.a + 1) * 2 >= 0),1,0)';
      tree.dfp(formula);
      expect(tree.root.type).toEqual(NodeType.Logic);
      expect(tree.root.statement).toEqual('');
      expect(tree.root.logicChild.statement).toEqual('(this.a + 1) * 2 >= 0');
      expect(tree.root.logicChild.type).toEqual(NodeType.Return);
      expect(tree.root.trueChild.statement).toEqual('1');
      expect(tree.root.falseChild.statement).toEqual('0');
    });
  });

  describe('combinations', () => {
    it('should handle a simple combination node', () => {
      tree.dfp('if(1,-1,2)+toNumber(this.myProperty)');
      expect(tree.root.type).toEqual(NodeType.Combination);
      expect(tree.root.wrappedChildren.length).toEqual(2);
      expect(tree.root.wrappedChildren[0].type).toEqual(NodeType.Wrapper);
      const logicNode = tree.root.wrappedChildren[0].wrappedChildren[0];
      expect(logicNode.logicChild.statement).toEqual('1');
      expect(logicNode.trueChild.statement).toEqual('-1');
      expect(logicNode.falseChild.statement).toEqual('2');
      expect(tree.root.wrappedChildren[1].type).toEqual(NodeType.Return);
      expect(tree.root.wrappedChildren[1].statement).toEqual(
        '+toNumber(this.myProperty)'
      );
    });
  });

  describe('getIfBlockStatements', () => {
    it('should handle multi-nested if statements', () => {});
  });
});
