
/**
 * returns the first instance of logic enclosed in brackets or parentheses
 * @param block - the block to parse
 * @returns whatever is in between () and {} blocks
 */
export function getStatement(block: string): string | undefined {
    // logic case
    let index;
    if ((index = block.indexOf('{')) != -1) {
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
 * @returns 
 */
export function getBlockContent(block: string, start = -1): [string, string | undefined] {
    start = start !== -1 ? start : block.indexOf('{');
    // base case: block is a return statement
    if (start == -1) {
        return [block, undefined];
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

export function getFalseBlockContent(block: string, index: number): string {
    const falseBlock = block.substring(index + 1, block.length);
    const blockContinues = falseBlock.startsWith('elseif');
    const start = blockContinues ? 4 : falseBlock.indexOf('{') + 1
    return falseBlock.substring(start, falseBlock.length - (blockContinues ? 0 : 1));
}

/**
 * converts a block
 * @param block
 * @returns 
 */
export function convertBlockContent(block: string): string {
    const regex = /(?<!\w)this\.([a-zA-Z0-9_]*)(?=[^()[\]{}*+-/])/g;
    return block.replace(regex, 'prop("$1")');
}