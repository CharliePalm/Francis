import { NodeType, Property } from '../model';
import { getBlockContent, getCallbackStatement, getStatement, parseCallbackStatement } from './helpers';

/**
 * this class is a binary tree representing the flow of logic
 */
export class Tree {
    root!: Node;
    size = 0;
    constructor(formula?: string, reverse = false) {
        if (formula && !reverse) this.dfp(formula)
        if (formula && reverse) this.reverseDfp(formula);
    }

    add(statement: string, parent: Node | undefined, type: NodeType, isTrueChild?: boolean) {
        // if (statement === undefined || statement === null) {
        //     throw new Error('attempted to add blank statement to tree with parent statement: ' + parent?.statement);
        // }
        const node = new Node(type, statement)
        if (!parent) {
            this.root = node;
        } else if (parent.type === NodeType.Wrapper || parent.type === NodeType.Combination || parent.nesting) {
            parent.addWrappedChild(node);
        } else {
            if (isTrueChild === undefined) {
                throw new Error('attempted to add node with parent without isTrueChild undefined');
            }
            if (isTrueChild) parent.addTrueChild(node)
            else parent.addFalseChild(node);
        }
        this.size += 1;
        return node;
    }

    /**
     * executes depth first propagation from right to left
     * right -> true statement. left -> false statement
     * @param block
     */
    dfp(block: string, parent?: Node, onTrueSide?: boolean) {
        const statement = getStatement(block);
        // no statement implies that getBlockContent returned our statement for us
        if (!statement) {
            // return case
            this.add(block, parent, NodeType.Return, onTrueSide);
            return;
        }

        if (statement === block) {
            // wrapper function case
            let bottomPtr = 0, topPtr = 0, depth = 0;
            let parsedStatement = '';
            const children: string[] = [];
            while (topPtr < statement.length) {
                if (statement[topPtr] === '(') {
                    depth++;
                    if (depth === 1) {
                        parsedStatement += statement.substring(bottomPtr, topPtr + 1)+')';
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
            const node = this.add(parsedStatement, parent, NodeType.Wrapper, onTrueSide);
            // if we've continued to iterate after the bottomPtr has been set to topPtr + 1, then we have a tail at the end of the wrapper
            if (topPtr !== bottomPtr) {
                // we don't want the tail to include the } character if the tail comes at the end of a return statement,
                // so this bit of logic on the end takes care of that
                node.tail = statement.substring(bottomPtr, statement[topPtr-1] !== '}' ? topPtr : topPtr - 1).replace('}', '');
            }
            children.forEach((childStatement) => {
                this.dfp(childStatement, node);
            });
            return;
        }

        // check for combination nodes
        const children = this.getCombinationNodeChildren(block);
        if (children.length > 2) {
            const node = this.add('', parent, NodeType.Combination, onTrueSide);
            children.forEach((childStatement) => this.dfp(childStatement, node));
            return;
        }

        // check for nested logic nodes
        let node: Node
        if (statement.includes('if(')) {
            const endIdx = Math.max(statement.lastIndexOf(')'), statement.lastIndexOf('}'));
            node = this.add(statement.substring(endIdx), parent, NodeType.Logic, onTrueSide);
            node.nesting = true;
            this.dfp(statement.substring(0, endIdx), node);
            node.nesting = false;
        } else {
            // logic case
            node = this.add(statement, parent, NodeType.Logic, onTrueSide);
        }

        // "nose" on the front - arithmetic or something we need to include before the if statement
        if (block.slice(0, 2) !== 'if') {
            node.nose = block.slice(0, block.indexOf('if('));
        }
        const [t, f] = getBlockContent(block);
        if (!f) {
            throw new Error('error processing input: unexpected blank false block from true block: ' + t);
        }
        let updatedFalseBlock = f;
        if (!parent?.nesting) {
            let [closed, open, lastClosedIdx] = [0, 0, -1];
            for (let idx = 0; idx < f.length; idx++) {
                closed += f[idx] === '}' ? 1 : 0;
                open += (f[idx] === '{' ? 1 : 0);
                lastClosedIdx = f[idx] === '}' ? idx : lastClosedIdx;
            }

            if (lastClosedIdx !== -1 && closed !== open) {
                node.tail = f.substring(lastClosedIdx + 1);
                updatedFalseBlock = f.substring(0, lastClosedIdx);
            }
        } else {
            const lastCLosedIdx = f.lastIndexOf('}');
            updatedFalseBlock = lastCLosedIdx !== -1 ? f.substring(0, lastCLosedIdx) : f;
        }
        this.dfp(t, node, true); this.dfp(updatedFalseBlock, node, false);
    }

    /**
     * reverse in this context means Notion -> Typescript, not reversing logic.
     * This instantiates a tree from a notion formula for processing and converting to typescript
     * Because notion formulas are much simpler and rigid than typescript, this process is a lot less hacky
     * @param formula the notion formula to process
     */
    reverseDfp(block: string, parent?: Node, onTrueSide = false) {
        const firstIdx = block.indexOf('(');
        if (firstIdx === -1) {
            // return case
            this.add(block, parent, NodeType.Return, onTrueSide);
        } else if (block.substring(0, 2) === 'if') {
            // if (...) {...} case
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
            // Use match to capture the three groups
            if (matches.length === 3) {
                parent = this.add(matches[0], parent, NodeType.Logic, onTrueSide);
                this.reverseDfp(matches[1], parent, true);
                this.reverseDfp(matches[2], parent, false);
            } else { throw new Error('improperly formatted if block detected: ' + block + '\n got matches ' + JSON.stringify(matches?.toString())) }
        } else if (/^[a-zA-Z0-9]+\(/.test(block)) {
            // wrapper case
            const wrappers = block.split('(');
            let completeWrapper = '';
            let ct = 0;
            for (const wrapper of wrappers) {
                if (wrapper == 'if') {
                    break;
                }
                completeWrapper += 'this.' + wrapper + '(';
                ct += 1;
            }
            parent = this.add(completeWrapper, parent, NodeType.Wrapper, onTrueSide);
            this.reverseDfp(block.substring(completeWrapper.length - 5 * ct, block.length - ct), parent, onTrueSide);
        } else {
            // TODO handle ternaries ?
        }
    }

    /**
     * Checks if statement is logic separated by operators 
     * @param block 
     * @returns the split statement
     */
    private getCombinationNodeChildren(block: string): string[] {
        // check for combination node:
        const children: string[] = [];
        let [index, bottomPtr, depth] = [0, 0, 0];
        while (index < block.length) {
            if (['(', '{'].includes(block[index])) {
                depth += 1;
            } else if ([')', '}'].includes(block[index])) {
                depth -= 1;
                if (index === block.length - 1 && children.length > 1) {
                    children.push(block.substring(bottomPtr, block.length));
                    break;
                }
            } else if (
                depth === 0 && (['+', '-', '/', '*', '<', '>'].includes(block[index]) || 
                (index !== 0 && ['||', '&&'].includes(block[index - 1] + block[index])))
            ) {
                const isDoubleChar = index !== 0 && ['||', '&&'].includes(block[index - 1] + block[index])
                children.push(block.substring(bottomPtr, isDoubleChar ? index - 1 : index));
                bottomPtr = index;
                children.push(block.substring(isDoubleChar ? bottomPtr - 1 : bottomPtr, index + 1));
                bottomPtr = index + 1;
            }
            index += 1;
        }
        if (children.length > 2 && children[children.length - 1].length === 1) {
            // we have a tail - i.e. there is an operator in the last position of the array and we need to add on the rest of the string
            children.push(block.substring(bottomPtr, block.length));
        }
        return children;
    }
}

export class Node {
    public trueChild!: Node;
    public falseChild!: Node;
    public wrappedChildren!: Node[];
    public tail = '';
    public nose = '';
    public nesting = false;

    constructor(public type: NodeType, public statement: string) {}
    
    addTrueChild(child: Node) {
        if (this.type !== NodeType.Logic) {
            throw new Error('cannot add true child to non logic node')
        }
        this.trueChild = child;
    }

    addFalseChild(child: Node) {
        if (this.type !== NodeType.Logic) {
            throw new Error('cannot add false child to non logic node')
        }
        this.falseChild = child;
    }

    addWrappedChild(child: Node) {
        if (this.type === NodeType.Return) {
            throw new Error('cannot add wrapped child to return node')
        }
        if (!this.wrappedChildren) this.wrappedChildren = [];
        this.wrappedChildren.push(child);
    }

    addTail(tail: string) {
        this.tail = tail;
    }

    // helpers

    /**
     * replaces all references to builtin notion functions and typescript operators
     * @param node
     */
    public replaceFunctionsAndOperators(): void {
        if (!this) return;
        // replace all uses of this. with '', && with and, || with or, and ! with not when not followed by an equals sign
        const replace = (str: string) => str?.replace(/this\./g, '')
            .replace(/&&/g, ' and ')
            .replace(/\|\|/g, ' or ')
            .replace(/!(?![=])/g, ' not ')
            // we shouldn't have any instances of brackets, but... it's a failsafe
            .replace('}', ')');
        this.statement = replace(this.statement);
        this.nose = replace(this.nose);
        this.tail = replace(this.tail);
    }

    /**
     * replaces all references to db properties
     */
    public replaceProperties(propertyMap: Record<string, Property>): void {
        if (!this) return;
        // replace .value
        this.statement = this.statement?.replace(/this\.(\w+)\.value/g, (_, property) => `prop("${(propertyMap)[property]?.propertyName}")`);
        // replace object method calls - if the property is a DB property then replace it, otherwise it's a builtin function call so just use it
        this.statement = this.statement?.replace(/this\.(\w+)/g, (_, property) => (propertyMap)[property] ? `prop("${(propertyMap)[property]?.propertyName}")` : property);
        // remove all leftover .values
        this.statement = this.statement?.replace(/\.value/g, '');

        this.replaceFunctionsAndOperators();
        this.replaceCallbacks();
        this.trueChild?.replaceProperties(propertyMap);
        this.falseChild?.replaceProperties(propertyMap);
        this.wrappedChildren?.forEach((child) => {
            child.replaceProperties(propertyMap);
        });
    }

    private replaceCallbacks(): void {
        const callbacks = getCallbackStatement(this.statement);
        callbacks.forEach((callback) => {
            const parsedCallback = parseCallbackStatement(callback);
            this.statement = this.statement?.replace(callback, parsedCallback);
        });
    }
}
