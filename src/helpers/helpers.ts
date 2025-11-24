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
  let index = block.indexOf('(') + 1; // start after if( or elseIf call
  let depth = 1; // because we start right after the if
  const depthChars = ['(', '{'];
  const deDepthChars = [')', '}'];
  let bottomIdx = index;
  const blocks = new Array(3);
  let blockIdx = 0;
  while (index < block.length) {
    if (depthChars.includes(block[index])) {
      depth++;
      if (depth === 1 && block[index] === '{') {
        bottomIdx = index + 1;
      }
    } else if (deDepthChars.includes(block[index])) depth--;
    // looking for what's in the if(...) block
    if (blockIdx === 0) {
      if (depth === 0 && block[index] === ')') {
        blocks[blockIdx++] = block.substring(bottomIdx, index);
      }
    } else if (depth === 0 && block[index] === '}') {
      // getting the if(){...} part of the block (true case)
      blocks[blockIdx++] = block.substring(bottomIdx, index);
      // getting the false case
      while (
        !deDepthChars.concat(depthChars).includes(block[++index]) &&
        index < block.length
      ) {}
      // add 'if' if it was present (i.e. in an elseif block)
      const prefix = block.substring(index - 2, index) === 'if' ? 'if(' : '';
      blocks[blockIdx++] =
        prefix + block.substring(index + 1, block.length - (prefix ? 0 : 1));
      return blocks;
    }
    index++;
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
