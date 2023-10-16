import { Node } from './tree';
/**
 * returns the first instance of logic enclosed in brackets or parentheses
 * @param block - the block to parse
 * @returns whatever is in between () and {} blocks
 */
export function getStatement(block: string): string | undefined {
    let index = block.indexOf('{');
    // wrapper function case:
    if (block.startsWith('this.') && (index != -1)) {
        return block;
    }
    // logic case
    if (index != -1) {
        while (index > 0) {
            index -= 1;
            if (block[index] == ')') {
                break;
            }
        }
        return block.substring(block.indexOf('(') + 1, index);
    }
    // return case
    return undefined;
}

/**
 * gets the content of the block, including further logic
 * @param block 
 * @param start 
 * @returns [true block, false block]
 */
export function getBlockContent(block: string, start = -1): [string, string | undefined] {
    start = start !== -1 ? start : block.indexOf('{');
    // base case: block is a return statement
    if (start == -1) {
        return [block.substring(0, block.lastIndexOf('}')), undefined];
    }
    let depth = 0;
    let index = start;
    while (index < block.length) {
        depth += block[index] == '{' ? 1 : block[index] == '}' ? -1 : 0;
        // first index should always increment depth so if depth is 0 we return
        if (depth == 0) {
            break;
        }
        index++;
    }
    return [block.substring(start + 1, index), index + 1 !== block.length ? getFalseBlockContent(block, index) : undefined];
}

/**
 * gets the false content of the block, provided the index of where the true block ended
 * @param block the entire block, featuring both true and false content
 * @param index the index where the false block ended
 * @returns the parsed false block
 */
export function getFalseBlockContent(block: string, index: number): string | undefined {
    const falseBlock = block.substring(index + 1, block.length);
    if (falseBlock.startsWith('else')) {
        const blockContinues = falseBlock.startsWith('elseif');
        // we need to get the logic in the if () part of the else if block if the block continues
        const start = blockContinues ? 4 : falseBlock.indexOf('{') + 1;
        const endModifier = blockContinues || falseBlock.lastIndexOf('}') !== falseBlock.length - 1 ? 0 : 1;
        return falseBlock.substring(start, falseBlock.length - endModifier);
    }
    // fall through case
    const lastClosedBracketIdx = falseBlock.lastIndexOf('}');
    // if the last part of the block is the fall through case we got lucky
    return lastClosedBracketIdx == -1 ? falseBlock : falseBlock.substring(0, lastClosedBracketIdx);
    // we'll handle this in the future. Right now we're just returning the false block in the error case but this indicates we'd have to fall out of the current if block.
    // this is more hassle than it's worth to develop at the moment so I'm leaving this here for now but will update in the future
    throw new Error('Please avoid nesting an if block with no else block. For example: if (1 == 1){ if (2 == 2) {}} should just be if (1==1 and 2==2) {}')
}

/**
 * converts a block's object property references to the notion format
 * @param block 
 * @returns the converted block
 */
export function convertBlockContent(block: string): string {
    const regex = /(?<!\w)this\.([a-zA-Z0-9_]*)(?=[^()[\]{}*+-/])/g;
    return block.replace(regex, 'prop("$1")');
}

/**
 * 
 */
export function getCallbackStatement(block: string): string[] {
    let index = 0;
    let lastOpenParenthesesIndex = -1;
    let inCallback = false;
    let depth = 0;
    const callbacks: string[] = [];
    while (index < block.length - 1) {
        if (block[index] == '(') {
            if (!inCallback) {
                lastOpenParenthesesIndex = index;
            }
            depth = inCallback ? depth + 1 : 1;
        } else if (block[index] == ')' && inCallback) {
            depth -= 1;
            if (depth == 0) {
                callbacks.push(block.substring(lastOpenParenthesesIndex, index));
                inCallback = false;
            }
        }

        if (block[index].concat(block[index+1]) == '=>') {
            inCallback = true;
        }
        index++;
    }
    return callbacks;
}

export function parseCallbackStatement(callback: string): string {
    if(!callback) return callback;
    const paramString = callback.substring(1, callback.indexOf(')'));
    const params = paramString.replace(' ', '').split(',');
    params.forEach((param, index) => {
        callback = callback.replace(
            new RegExp(param, 'g'),
            params.length === 1 || index === 1 ? 'current' : 'index',
        );
    });
    return callback.substring(callback.indexOf('=>') + 2);
}