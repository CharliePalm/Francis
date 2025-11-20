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
      expect(tree.root.wrappedChildren[0].type).toEqual(NodeType.Logic);
      expect(tree.root.wrappedChildren.length).toEqual(1);
      expect(tree.root.wrappedChildren[0].statement).toEqual('this.myProperty');
      expect(tree.root.statement).toEqual('this.round()');
    });
  });
});
