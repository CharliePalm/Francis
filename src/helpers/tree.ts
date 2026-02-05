import { NodeType } from '../model';
import { Node } from './node';
import { getCombinationNodeChildren, getLogicChildren } from './helpers';
import { Logger } from './logger';

/**
 * this class is a binary tree representing the flow of logic
 */
export class Tree {
  root!: Node;
  size = 0;
  constructor(formula?: string, public isReverse = false) {
    if (formula) this.dfp(formula);
  }

  add(
    statement: string,
    parent: Node | undefined,
    type: NodeType,
    isTrueChild?: boolean
  ) {
    // if (statement === undefined || statement === null) {
    //     throw new Error('attempted to add blank statement to tree with parent statement: ' + parent?.statement);
    // }
    const node = new Node(type, statement, this.isReverse);
    if (!parent) {
      this.root = node;
    } else if (
      parent.type === NodeType.Wrapper ||
      parent.type === NodeType.Combination ||
      parent.nesting
    ) {
      parent.addWrappedChild(node);
    } else {
      if (isTrueChild) parent.addTrueChild(node);
      else if (isTrueChild === undefined) parent.addLogicChild(node);
      else parent.addFalseChild(node);
    }
    this.size += 1;
    return node;
  }

  handleWrapperFunction(
    statement: string,
    parent?: Node,
    side?: boolean
  ): void {
    let [bottomPtr, topPtr, depth] = [0, 0, 0];
    let parsedStatement = '';
    const children: string[] = [];
    while (topPtr < statement.length) {
      if (statement[topPtr] === '(') {
        depth++;
        if (depth === 1) {
          parsedStatement += statement.substring(bottomPtr, topPtr + 1) + ')';
          bottomPtr = topPtr + 1;
        }
      } else if (statement[topPtr] === ')') {
        if (depth === 1) {
          children.push(statement.substring(bottomPtr, topPtr));
          bottomPtr = topPtr + 1;
        }
        depth--;
      }
      topPtr++;
    }
    const node = this.add(parsedStatement, parent, NodeType.Wrapper, side);

    Logger.debug('wrapping children - ', children);
    children.forEach((childStatement) => {
      this.dfp(childStatement, node);
    });
  }

  handleLogic(block: string, parent?: Node, side?: boolean) {
    const [logic, t, f] = getLogicChildren(block);
    if (!logic || !t || !f) {
      throw new Error(
        'error processing input: unexpected blank block ' + { logic, t, f }
      );
    }
    Logger.debug('logic children: ', [logic, t, f]);
    parent = this.add('', parent, NodeType.Logic, side);
    this.dfp(logic, parent, undefined);
    this.dfp(t, parent, true);
    this.dfp(f, parent, false);
  }

  handleCombinationNode(
    combinations: string[],
    parent?: Node,
    side?: boolean
  ): void {
    const node = this.add('', parent, NodeType.Combination, side);
    combinations.forEach((childStatement) => this.dfp(childStatement, node));
  }

  parenthesesWrapperHandler(
    block: string,
    parent?: Node,
    side?: boolean,
    addWrapper = true
  ) {
    block = block.slice(1, -1);
    Logger.debug(
      'shaving parentheses from block - adding parentheses as wrapper and continuing dfp with new block: ',
      block
    );
    parent = addWrapper
      ? this.add('()', parent, NodeType.Wrapper, side)
      : parent;
    this.dfp(block, parent, side);
  }

  /**
   * executes depth first propagation from right to left
   * right -> true statement. left -> false statement
   * @param block
   */
  dfp(block: string, parent?: Node, side?: boolean) {
    const combinations = getCombinationNodeChildren(block);
    const combinationHasLogic = combinations.some((child) =>
      child.includes('if(')
    );
    if (combinations.length > 2 && combinationHasLogic) {
      this.handleCombinationNode(combinations, parent, side);
    } else if (
      block.startsWith('(') &&
      block.endsWith(')') &&
      combinations.length === 0
    ) {
      this.parenthesesWrapperHandler(block, parent, side);
    } else if (block.startsWith('this.') && block.includes('if(')) {
      // wrapper function case
      this.handleWrapperFunction(block, parent, side);
    } else if (block.startsWith('if(')) {
      this.handleLogic(block, parent, side);
    } else {
      // if nothing else, this is a return node
      if (block.includes('{') || block.includes('}')) {
        throw Error(
          'improperly formatted block classified as return node - there are still brackets present: ' +
            block
        );
      }
      this.add(block, parent, NodeType.Return, side);
    }
  }
}
