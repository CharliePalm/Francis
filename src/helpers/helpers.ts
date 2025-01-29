import format from "prettier-eslint";

/**
 * returns the first instance of logic enclosed in brackets or parentheses
 * @param block - the block to parse
 * @returns whatever is in between () and {} blocks
 */
export function getStatement(block: string): string | undefined {
    let [index, depth] = [block.indexOf('if(') + 3, 1];
    // wrapper function case:
    if (block.startsWith('this.') && index !== 2) {
        return block;
    }

    // logic case
    if (index !== 2) { // index === 2 means that 'if(' was not present in the string
        const startingIndex = index;
        while (index < block.length) {
            depth += block[index] === '(' ? 1 : block[index] === ')' ? -1 : 0; 
            if (depth === 0) {
                break;
            }
            index += 1;
        }
        return block.substring(startingIndex, index);
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
    start = start !== -1 ? start : getEndOfIfBlockIndex(block);
    // base case: block is a return statement
    if (start === -1) {
        return [block.substring(0, block.lastIndexOf('}')), undefined];
    }
    let depth = 0;
    let index = start;
    while (index < block.length) {
        depth += block[index] === '{' ? 1 : block[index] === '}' ? -1 : 0;
        // first index should always increment depth so if depth is 0 we return
        if (depth === 0) {
            break;
        }
        index++;
    }
    return [block.substring(start + 1, index), index + 1 !== block.length ? getFalseBlockContent(block, index) : undefined];
}

export function getEndOfIfBlockIndex(block: string): number {
    let idx = block.indexOf('if(') + 3;
    let depth = 1;
    while (idx < block.length) {
        depth += block[idx] === '(' ? 1 : block[idx] === ')' ? -1 : 0; 
        if (depth === 0 && block[idx] === '{') {
            return idx;
        }
        idx += 1;
    }
    return -1;
}

export function getNestedIfTail(block: string): string {
    return block.substring(block.lastIndexOf(')') + 1, block.length);
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
        // we need to get the logic in the if () part of the "else if" block if the block continues
        const start = blockContinues ? 4 : falseBlock.indexOf('{') + 1;
        const endModifier = blockContinues || falseBlock.lastIndexOf('}') !== falseBlock.length - 1 ? 0 : 1;
        return falseBlock.substring(start, falseBlock.length - endModifier);
        // return falseBlock.substring(start, falseBlock.lastIndexOf('}') + (blockContinues ? 1 : 0)); // save the last bracket char if we need to keep parsing this block
    }
    // fall through case
    const lastClosedBracketIdx = falseBlock.lastIndexOf('}');
    // if the last part of the block is the fall through case we got lucky
    return lastClosedBracketIdx === -1 ? falseBlock : falseBlock.substring(0, lastClosedBracketIdx);
}

/**
 * creates a notion callback from a typescript callback
 */
export function getCallbackStatement(block?: string): string[] {
    if (!block) {return []}
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

        if (block[index].concat(block[index+1]) === '=>') {
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
            new RegExp(`(?<![a-zA-Z0-9"])${param}(?![a-zA-Z0-9"])(?=(?:[^"]*"[^"]*")*[^"]*$)`, 'g'),
            params.length === 1 || index === 1 ? 'current' : 'index',
        );
    });
    return callback.substring(callback.indexOf('=>') + 2);
}

export const esLintFormat = (code: string) => format({
    text: code,
    prettierOptions: {
        parser: 'typescript',
    }
});
