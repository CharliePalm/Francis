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
    this.dfp(
      wrapperBlock.substring(i + 1, wrapperBlock.length - depth - 1),
      parent,
      side
    );
  }

  combinationHandler(children: string[], parent?: Node): void {
    let subStatement = '';
    children.forEach((childStatement) => {
      if (childStatement.includes('if(')) {
        if (subStatement.length) {
          this.add(subStatement, parent, NodeType.Return);
          subStatement = '';
        }
        const innerWrapperParent = this.add('', parent, NodeType.Wrapper);
        this.dfp(childStatement.trim(), innerWrapperParent);
      } else {
        subStatement += childStatement;
      }
    });
    if (subStatement.length) {
      this.add(subStatement, parent, NodeType.Return);
    }
    return;
  }

  handleCallback(parent: Node, block: string) {
    // calback case
    // I don't think that we can handle more complex (i.e. nested) callbacks...
    // perhaps I'll find a case that I think is doable and try to implement a solution but I doubt it's really feasible.
    // IMO this is good enough
    parent!.rawStatement = parent!.rawStatement.slice(0, -1) + block + ')';
    parent!.type = NodeType.Return;
    return;
  }

  getIfBlockStatements(block: string) {
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
    return matches;
  }

  ifBlockHandler(block: string, parent?: Node, side?: boolean) {
    const matches = this.getIfBlockStatements(block);

    if (matches.length === 3) {
      parent = this.add('', parent, NodeType.Logic, side);
      this.dfp(matches[0], parent, undefined);
      this.dfp(matches[1], parent, true);
      this.dfp(matches[2], parent, false);
    } else {
      throw new Error(
        'improperly formatted if block detected: ' +
          block +
          '\n got matches ' +
          JSON.stringify(matches?.toString())
      );
    }
  }

  dfp(block: string, parent?: Node, side?: boolean): void {
    if (block.startsWith('(index, current) =>')) {
      this.handleCallback(parent!, block);
      return;
    }
    // check for combination nodes
    const children = this.getCombinationNodeChildren(block);
    if (children.length > 2) {
      parent = this.add('', parent, NodeType.Combination);
      this.combinationHandler(children, parent);
    } else if (block.startsWith('if(')) {
      // if (...) {...} case
      this.ifBlockHandler(block, parent, side);
    } else if (block.startsWith('this.') && block.includes('if(')) {
      this.handleWrapperFunction(block, parent, side);
    } else {
      // todo - handle ternaries?
      // return case
      this.add(block, parent, NodeType.Return, side);
    }
  }
}
