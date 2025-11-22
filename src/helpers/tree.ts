import { NodeType } from '../model';
import { Node } from './node';
import { getBlockContent, getStatement } from './helpers';
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
    const statement = getStatement(block);
    // no statement implies that getBlockContent returned our statement for us
    if (!statement) {
      // return case
      this.add(block, parent, NodeType.Return, side);
      return;
    }

    if (statement === block) {
      // wrapper function case
      this.handleWrapperFunction(statement, parent, side);
      return;
    }

    const combinations = this.getCombinationNodeChildren(block);
    if (combinations.length > 2) {
      this.handleCombinationNode(combinations, parent, side);
      return;
    }

    // check for nested logic nodes
    let node: Node;
    if (statement.includes('if(')) {
      const endIdx = Math.max(
        statement.lastIndexOf(')'),
        statement.lastIndexOf('}')
      );
      node = this.add(
        statement.substring(endIdx),
        parent,
        NodeType.Logic,
        side
      );
      node.nesting = true;
      this.dfp(statement.substring(0, endIdx), node);
      node.nesting = false;
    } else {
      // logic case
      node = this.add(statement, parent, NodeType.Logic, side);
    }

    // "nose" on the front - arithmetic or something we need to include before the if statement
    if (block.slice(0, 2) !== 'if') {
      node.nose = block.slice(0, block.indexOf('if('));
    }
    const [t, f] = getBlockContent(block);
    if (!f) {
      throw new Error(
        'error processing input: unexpected blank false block from true block: ' +
          t
      );
    }
    let updatedFalseBlock = f;
    if (!parent?.nesting) {
      let [closed, open, lastClosedIdx] = [0, 0, -1];
      for (let idx = 0; idx < f.length; idx++) {
        closed += f[idx] === '}' ? 1 : 0;
        open += f[idx] === '{' ? 1 : 0;
        lastClosedIdx = f[idx] === '}' ? idx : lastClosedIdx;
      }

      if (lastClosedIdx !== -1 && closed !== open) {
        node.tail = f.substring(lastClosedIdx + 1);
        updatedFalseBlock = f.substring(0, lastClosedIdx);
      }
    } else {
      const lastCLosedIdx = f.lastIndexOf('}');
      updatedFalseBlock =
        lastCLosedIdx !== -1 ? f.substring(0, lastCLosedIdx) : f;
    }
    this.dfp(t, node, true);
    this.dfp(updatedFalseBlock, node, false);
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
    Logger.debug('getting block children');
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
        index += 1;
        continue;
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
        Logger.debug('found operator in string at index ', index);
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
      ['+', '-', '/', '*', '<', '>', '||', '&&'].some((operator) =>
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
