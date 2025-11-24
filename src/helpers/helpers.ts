import format from 'prettier-eslint';
import { Logger } from './logger';
import { DepthTracker } from './depthTracker';

/**
 * Gets the arguments to a notion logic function.
 * @param block a typescript block like if(logic){trueCase}else{falseCase}
 * @returns the different parts of the logic function in the form [logic, true, false]
 */
export function getLogicChildren(block: string) {
  if (!block.startsWith('if(') || !block.endsWith('}')) {
    throw new Error('getLogicChildren called with non logic block - ' + block);
  }
  const tracker = new DepthTracker(block);
  while (tracker.depth === 0) {
    tracker.inc();
  }
  // + 1 here to move past the ( char
  let bottomIdx = tracker.index + 1;
  const blocks = new Array(3);
  let blockIdx = 0;
  while (tracker.inc()) {
    if (tracker.depth === 1 && tracker.currChar === '{') {
      bottomIdx = tracker.index + 1;
    }
    // looking for what's in the if(...) block
    if (blockIdx === 0) {
      if (tracker.depth === 0 && tracker.currChar === ')') {
        blocks[blockIdx++] = block.substring(bottomIdx, tracker.index);
      }
    } else if (tracker.depth === 0 && tracker.currChar === '}') {
      // getting the if(){...} part of the block (true case)
      blocks[blockIdx++] = block.substring(bottomIdx, tracker.index);
      // getting the false case
      const currDepth = tracker.depth;
      while (currDepth === tracker.depth && tracker.inc()) {}
      // add 'if' if it was present (i.e. in an elseif block)
      const prefix =
        block.substring(tracker.index - 2, tracker.index) === 'if' ? 'if(' : '';
      blocks[blockIdx] =
        prefix +
        block.substring(tracker.index + 1, block.length - (prefix ? 0 : 1));
      return blocks;
    }
  }
  throw new Error(
    `ran out of while loop while looking for logic children for block - ${block}, found children: ${blocks}`
  );
}

/**
 * gets a callback statement from within a block
 */
export function getCallbackStatement(block?: string): string[] {
  if (!block) {
    return [];
  }
  let index = 0;
  let lastOpenParenthesesIndex = -1;
  let inCallback = false;
  let depth = 0;
  const callbacks: string[] = [];
  while (index < block.length) {
    if (block[index] === '(') {
      if (!inCallback) {
        lastOpenParenthesesIndex = index;
      }
      depth = inCallback ? depth + 1 : 1;
    } else if (block[index] === ')' && inCallback) {
      depth -= 1;
      if (depth === 0) {
        callbacks.push(block.substring(lastOpenParenthesesIndex, index));
        inCallback = false;
      }
    }

    if (block[index].concat(block[index + 1]) === '=>') {
      inCallback = true;
    }
    index++;
  }
  return callbacks;
}

export function parseCallbackStatement(callback: string): string {
  if (!callback) return callback;
  const paramString = callback.substring(1, callback.indexOf(')'));
  const params = paramString.replace(' ', '').split(',');
  params.forEach((param, index) => {
    callback = callback.replace(
      new RegExp(
        `(?<![a-zA-Z0-9"])${param}(?![a-zA-Z0-9"])(?=(?:[^"]*"[^"]*")*[^"]*$)`,
        'g'
      ),
      params.length === 1 || index === 1 ? 'current' : 'index'
    );
  });
  return callback.substring(callback.indexOf('=>') + 2);
}

export const esLintFormat = (code: string) =>
  format({
    text: code,
    prettierOptions: {
      parser: 'typescript',
    },
  });

/**
 * Checks if statement is logic separated by operators
 * @param block
 * @returns the split statement
 */
export function getCombinationNodeChildren(block: string): string[] {
  Logger.debug('getting children for statement: ', block);

  // check for combination node:
  const children: string[] = [];
  const tracker = new DepthTracker(block);
  let bottomPtr = 0;

  while (tracker.inc()) {
    if (
      tracker.lastChar != ',' &&
      tracker.depth === 0 &&
      !tracker.inQuote &&
      (['+', '-', '/', '*', '<', '>'].includes(tracker.currChar) ||
        ['||', '&&', '=='].includes(tracker.lastChar + tracker.currChar))
    ) {
      const isBooleanOperator = ['||', '&&', '=='].includes(
        tracker.lastChar + tracker.currChar
      );
      if (
        (isBooleanOperator ? tracker.index - 1 : tracker.index) - bottomPtr >
        0
      ) {
        children.push(
          block
            .substring(
              bottomPtr,
              isBooleanOperator ? tracker.index - 1 : tracker.index
            )
            .trim()
        );

        const topIndex =
          tracker.index +
          (['<', '>'].includes(tracker.currChar) && tracker.nextChar === '='
            ? 2
            : 1);
        children.push(
          block
            .substring(
              isBooleanOperator ? tracker.index - 1 : tracker.index,
              topIndex
            )
            .trim()
        );
        bottomPtr = topIndex;
      }
    }
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
