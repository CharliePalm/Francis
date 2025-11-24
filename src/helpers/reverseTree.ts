import { Tree } from './tree';
import { Node } from './node';
import { NodeType } from '../model';
import { getCombinationNodeChildren } from './helpers';
import { Logger } from './logger';

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

  combinationHandler(children: string[], combinationParent?: Node): void {
    let subStatement = '';
    children.forEach((childStatement) => {
      if (childStatement.includes('if(')) {
        if (subStatement.length) {
          this.add(subStatement, combinationParent, NodeType.Return);
          subStatement = '';
        }
        const innerWrapperParent = this.add(
          '',
          combinationParent,
          NodeType.Wrapper
        );
        this.dfp(childStatement, innerWrapperParent);
      } else {
        subStatement += childStatement;
      }
    });
    Logger.debug('finished iterating - substatement: ', subStatement);
    if (subStatement.length) {
      this.add(subStatement, combinationParent, NodeType.Return);
    }
    return;
  }

  handleCallback(parent: Node, block: string) {
    // callback case
    // I don't think that we can handle more complex (i.e. nested) callbacks...
    // perhaps I'll find a case that I think is doable and try to implement a solution but I doubt it's really feasible.
    // IMO this is good enough
    parent.statement = parent.statement.slice(0, -1) + block + ')';
    parent.type = NodeType.Return;
    Logger.debug('updated parent with callback: ', parent.statement);
    return;
  }

  getIfBlockStatements(block: string) {
    let depth = 0;
    let bottomIdx = 3; // after the if(
    const matches = [];
    for (let i = 2; i < block.length; i++) {
      depth += block[i] === '(' ? 1 : block[i] === ')' ? -1 : 0;
      if (depth === 1 && block[i] === ',') {
        matches.push(block.substring(bottomIdx, i).trim());
        bottomIdx = i + 1;
      }
    }
    matches.push(block.substring(bottomIdx, block.length - 1).trim());
    return matches;
  }

  ifBlockHandler(block: string, parent?: Node, side?: boolean) {
    const matches = this.getIfBlockStatements(block);
    Logger.info('if block: ', matches);
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
    block = block.trim();
    Logger.debug('DFP iteration with block: ', block);
    if (block.startsWith('(index, current) =>')) {
      if (!parent) {
        throw Error('no parent defined in dfp loop but callback spotted');
      }
      this.handleCallback(parent, block);
      return;
    }
    // check for combination nodes
    const children = getCombinationNodeChildren(block);
    if (
      children.length > 2 &&
      children.some((child) => child.includes('if('))
    ) {
      Logger.info('Combination node detected: ', children);
      parent = this.add('', parent, NodeType.Combination);
      this.combinationHandler(children, parent);
      return;
    } else if (block.startsWith('(') && block.endsWith(')')) {
      // if we have parentheses on both sides and no combination, that means these parentheses are redundant, slice 'em off and retry
      block = block.slice(1, -1);
      this.dfp(block, parent, side);
    } else if (block.startsWith('if(')) {
      // if (...) {...} case
      this.ifBlockHandler(block, parent, side);
    } else if (block.startsWith('this.') && block.includes('if(')) {
      this.handleWrapperFunction(block, parent, side);
    } else {
      // todo - handle ternaries?
      // return case
      Logger.info('Classified node as return node, no further work');
      this.add(block, parent, NodeType.Return, side);
    }
  }
}
