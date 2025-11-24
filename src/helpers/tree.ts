import { NodeType } from '../model';
import { Node } from './node';
import { getBlockContent, getLogicChildren, getStatement } from './helpers';
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
    // if we've continued to iterate after the bottomPtr has been set to topPtr + 1, then we have a tail at the end of the wrapper
    if (topPtr !== bottomPtr) {
      // we don't want the tail to include the } character if the tail comes at the end of a return statement,
      // so this bit of logic on the end takes care of that
      node.tail = statement
        .substring(
          bottomPtr,
          statement[topPtr - 1] !== '}' ? topPtr : topPtr - 1
        )
        .replace('}', '');
    }
    Logger.debug('wrapping children - ', children);
    children.forEach((childStatement) => {
      this.dfp(childStatement, node);
    });
  }

  handleLogicCase(block: string, parent?: Node, side?: boolean) {
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

  private handleCombinationNode(
    combinations: string[],
    parent?: Node,
    side?: boolean
  ): void {
    const node = this.add('', parent, NodeType.Combination, side);
    combinations.forEach((childStatement) => this.dfp(childStatement, node));
  }

  /**
   * executes depth first propagation from right to left
   * right -> true statement. left -> false statement
   * @param block
   */
  dfp(block: string, parent?: Node, side?: boolean) {
    const combinations = this.getCombinationNodeChildren(block);
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
      block = block.slice(1, -1);
      Logger.debug(
        'shaving parentheses from block - continue dfp with new block: ',
        block
      );
      this.dfp(block, parent, side);
    } else if (block.startsWith('this.') && block.includes('if(')) {
      // wrapper function case
      this.handleWrapperFunction(block, parent, side);
    } else if (block.startsWith('if(')) {
      this.handleLogicCase(block, parent, side);
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

  /**
   * Checks if statement is logic separated by operators
   * @param block
   * @returns the split statement
   */
  getCombinationNodeChildren(block: string): string[] {
    Logger.debug('getting children for statement: ', block);

    // check for combination node:
    const children: string[] = [];
    let [index, bottomPtr, depth] = [0, 0, 0];
    let inDoubleQuote = false;
    let inSingleQuote = false;
    const inQuote = () => inDoubleQuote || inSingleQuote;
    let lastChar: string = '';
    while (index < block.length) {
      if (block[index] === '"' || block[index] === "'") {
        if (block[index] === '"')
          inDoubleQuote = inSingleQuote ? inDoubleQuote : !inDoubleQuote;
        if (block[index] === "'")
          inSingleQuote = inDoubleQuote ? inSingleQuote : !inSingleQuote;
      } else if (inQuote() || block[index] === ' ') {
        index += 1;
        continue;
      }

      if (['(', '{'].includes(block[index]) && !inQuote()) {
        depth += 1;
      } else if ([')', '}'].includes(block[index]) && !inQuote()) {
        depth -= 1;
        if (index === block.length - 1 && children.length > 1) {
          children.push(block.substring(bottomPtr, block.length).trim());
          break;
        }
      } else if (
        lastChar != ',' &&
        depth === 0 &&
        !inQuote() &&
        (['+', '-', '/', '*', '<', '>'].includes(block[index]) ||
          (index !== 0 &&
            ['||', '&&', '=='].includes(block[index - 1] + block[index])))
      ) {
        const isBooleanOperator =
          index !== 0 &&
          ['||', '&&', '=='].includes(block[index - 1] + block[index]);
        if ((isBooleanOperator ? index - 1 : index) - bottomPtr > 0) {
          children.push(
            block
              .substring(bottomPtr, isBooleanOperator ? index - 1 : index)
              .trim()
          );

          const topIndex =
            index +
            (['<', '>'].includes(block[index]) && block[index + 1] === '='
              ? 2
              : 1);
          children.push(
            block
              .substring(isBooleanOperator ? index - 1 : index, topIndex)
              .trim()
          );
          bottomPtr = topIndex;
        }
      }
      lastChar = block[index];
      index += 1;
    }
    if (
      children.length >= 2 &&
      ['+', '-', '/', '*', '<', '>', '||', '&&', '=='].some((operator) =>
        children[children.length - 1].startsWith(operator)
      )
    ) {
      // we have a tail - i.e. there is an operator in the last position of the array and we need to add on the rest of the string
      children.push(block.substring(bottomPtr, block.length));
    }
    Logger.info('returning combination children: ', children);
    return children;
  }
}
