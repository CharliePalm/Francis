import { Tree } from './tree';
import { Node } from './node';
import { NodeType } from '../model';
import { parseCallbackStatement } from './helpers';

/**
 * reverse in this context means Notion -> Typescript, not reversing logic.
 */
export class ReverseTree extends Tree {
  constructor(formula?: string) {
    super(formula, true);
  }

  wrapperHandler(wrapperBlock: string, parent?: Node, side?: boolean): void {
    console.log('handling wrapper');
    // wrapper case
    let depth = 0,
      i = 0;
    for (i = 0; i < wrapperBlock.length - 3; i++) {
      if (wrapperBlock.substring(i, i + 3) === 'if(') {
        break;
      }
      depth += wrapperBlock[i] === '(' ? 1 : wrapperBlock[i] === ')' ? -1 : 0;
    }
    parent = this.add(
      wrapperBlock.substring(0, i),
      parent,
      NodeType.Wrapper,
      side
    );
    console.log(wrapperBlock.substring(0, i));
    this.dfp(
      wrapperBlock.substring(i + 1, wrapperBlock.length - depth - 1),
      parent,
      side
    );
  }

  dfp(block: string, parent?: Node, side?: boolean): void {
    console.log(block);
    if (block.startsWith('(index, current) =>')) {
      console.log('found callback');
      // calback case
      // I don't think that we can handle more complex (i.e. nested) callbacks...
      // perhaps I'll find a case that I think is doable and try to implement a solution but I doubt it's really feasible.
      // IMO this is good enough
      parent!.statement = parent!.statement.slice(0, -1) + block + ')';
      parent!.type = NodeType.Return;
      return;
    }

    // check for combination nodes
    const children = this.getCombinationNodeChildren(block);
    if (children.length > 2) {
      console.log('combination children', children);
      let subStatement = '';
      children.forEach((childStatement) => {
        if (childStatement.includes('if(')) {
          this.add(subStatement, parent, NodeType.Simple);
          console.log('added substatement', subStatement);
          subStatement = '';
          console.log('found if in combination child:', childStatement.trim());
          this.dfp(childStatement.trim(), parent);
        } else {
          subStatement += childStatement;
        }
      });
      this.add(subStatement, parent, NodeType.Simple);
      return;
    }

    if (block.startsWith('if(')) {
      // if (...) {...} case
      let depth = 0;
      let bottomIdx = 3;
      const matches = [];
      for (let i = 2; i < block.length; i++) {
        depth += block[i] === '(' ? 1 : block[i] === ')' ? -1 : 0;
        if (depth === 1 && block[i] === ',') {
          matches.push(block.substring(bottomIdx, i));
          bottomIdx = i + 1;
        }
      }
      matches.push(block.substring(bottomIdx, block.length - 1));
      console.log(matches);

      if (matches.length === 3) {
        if (matches[0].includes('if(')) {
          // nested if block
          console.log('nested if detected: ', matches[0]);
          parent = this.add('', parent, NodeType.Logic, side);
          parent.nesting = true;
          this.dfp(matches[0], parent, true);
          parent.nesting = false;
          // logic from tree.ts that I think we need to go to eventually

          // const endIdx = Math.max(
          //   block.lastIndexOf(')'),
          //   block.lastIndexOf('}')
          // );
          // parent = this.add(
          //   block.substring(endIdx),
          //   parent,
          //   NodeType.Logic,
          //   side
          // );
          // console.log('parent block: ', block.substring(endIdx));
          // console.log('iterating on', block.substring(0, endIdx));
          // parent.nesting = true;
          // this.dfp(block.substring(0, endIdx), parent);
          // parent.nesting = false;
        } else {
          parent = this.add(matches[0], parent, NodeType.Logic, side);
        }
        this.dfp(matches[1], parent, true);
        this.dfp(matches[2], parent, false);
        console.log(matches);
      } else {
        throw new Error(
          'improperly formatted if block detected: ' +
            block +
            '\n got matches ' +
            JSON.stringify(matches?.toString())
        );
      }
      return;
    }

    if (block.startsWith('this.')) {
      // const callback = parseCallbackStatement(block);
      // maybe need a combination node check here?
      this.handleWrapperFunction(block, parent, side);
      return;
    }

    // todo - handle ternaries?
    // return case
    this.add(block, parent, NodeType.Return, side);
  }
}
