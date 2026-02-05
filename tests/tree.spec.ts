/* eslint-disable @typescript-eslint/no-explicit-any */

import { NodeType } from '../src/model';
import { Tree } from '../src/helpers/tree';
import { Node } from '../src/helpers/node';

describe('buildTree', () => {
  it('should correctly add the root and create a simple tree', () => {
    const formula = 'if(x-y){dostuff}else{elsedostuff}';
    const tree = new Tree(formula);
    expect(tree.root.type).toEqual(NodeType.Logic);
    expect(tree.root.statement).toEqual('');
    expect(tree.root.logicChild.statement).toEqual('x-y');
    expect(tree.root.trueChild?.statement).toEqual('dostuff');
    expect(tree.root.falseChild?.statement).toEqual('elsedostuff');
  });

  it('should throw error when an else block is missing', () => {
    const formula =
      'if(x-y){if(a+b==0){dostuff}elseif(x-y===1){dostuff}}else{elsedostuff}';
    try {
      new Tree(formula);
    } catch (e: any) {
      expect(e.message).toEqual(
        'improperly formatted block classified as return node - there are still brackets present: }'
      );
    }
  });

  xit('should correctly create a complex tree', () => {
    // todo fix
    const formula =
      'if(x<y){if(a>b){if(y>z){z+1}else{z-1}}else{1+1}}else{if(x<y){if(y<z){z+1}else{z-1}}else{if(x===y){a+b}else{b-a}}}';

    const tree = new Tree(formula);
    let tc: Node, fc: Node, lc: Node;
    expect(tree.root.statement).toEqual('');
    expect(tree.root.type).toEqual(NodeType.Logic);
    lc = tree.root.logicChild;

    expect(lc.statement).toEqual('x<y');
    expect(lc.children).toHaveLength(0);

    tc = tree.root.trueChild;
    expect(tc?.statement).toEqual('');
    expect(tc.type).toEqual(NodeType.Logic);

    // true child
    [lc, tc, fc] = tc.children;

    expect(lc?.statement).toEqual('a>b');
    expect(tc?.statement).toEqual('');
    expect(tc.logicChild.statement).toEqual('y>z');
    expect(tc?.type).toEqual(NodeType.Logic);

    expect(fc?.statement).toEqual('z-1');
    expect(fc?.children).toHaveLength(0);

    tc = tree.root.trueChild;
    fc = tc.falseChild;
    expect(fc?.statement).toEqual('1+1');
    expect(fc?.children).toHaveLength(0);

    // root false child
    fc = tree.root.falseChild;
    expect(fc?.statement).toEqual('');
    expect(fc?.logicChild.statement).toEqual('x<y');
    expect(fc?.type).toEqual(NodeType.Logic);
    tc = fc.trueChild;

    expect(tc?.statement).toEqual('');
    expect(tc?.logicChild.statement).toEqual('y<z');
    expect(tc?.type).toEqual(NodeType.Logic);
    fc = tc.falseChild;
    tc = tc.trueChild;
    expect(tc?.statement).toEqual('z+1');
    expect(tc?.children).toHaveLength(0);
    expect(fc?.statement).toEqual('z-1');
    expect(fc?.children).toHaveLength(0);

    fc = tree.root.falseChild;
    fc = fc.falseChild;
    expect(fc?.statement).toEqual('x===y');
    expect(fc?.type).toEqual(NodeType.Logic);
    expect(fc?.trueChild?.statement).toEqual('a+b');
    expect(fc?.trueChild?.children).toHaveLength(0);
    expect(fc?.falseChild?.statement).toEqual('b-a');
    expect(fc?.falseChild?.children).toHaveLength(0);
  });
});
