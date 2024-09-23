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

    add(statement: string | undefined, parent: Node | undefined, type: NodeType, isTrueChild?: boolean) {
        if (!statement) {
            throw new Error('attempted to add blank statement to tree');
        }
        const node = new Node(type, statement)
        if (!parent) {
            this.root = node;
        } else if (parent.type === NodeType.Wrapper) {
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
        } else if (statement === block) {
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
                node.tail = statement.substring(bottomPtr, statement[topPtr-1] !== '}' ? topPtr : topPtr - 1);
            }
            children.forEach((childStatement) => {
                this.dfp(childStatement, node, true);
            });
        } else {
            // logic case
            const node = this.add(statement, parent, NodeType.Logic, onTrueSide);
            const [t, f] = getBlockContent(block);

            this.dfp(t, node, true);
            if (!f) {
                throw new Error('error processing input: unexpected blank false block');
            }

            let filteredFalseBlock = f;
            // when we have a lone } char in the false block, that indicates that we have a tail (that comes after the } char)
            if (f.indexOf('{') === -1 && f.indexOf('}') !== -1) {
                filteredFalseBlock = f.substring(0, f.indexOf('}'));
                node.tail = f.substring(f.indexOf('}') + 1, f.length);
            }
            this.dfp(filteredFalseBlock, node, false);   
        }
    }

    /**
     * reverse in this context means Notion -> Typescript, not reversing logic.
     * This instantiates a tree from a notion formula for processing and converting to typescript
     * Because notion formulas are much simpler and rigid than typescript, this process is a lot less hacky
     * @param formula the notion formula to process
     */
    reverseDfp(block: string, parent?: Node, onTrueSide = false) {
        console.log(block);
        const firstIdx = block.indexOf('(');
        if (firstIdx === -1) {
            // return case
            this.add(block, parent, NodeType.Return, onTrueSide);
        } else if (block.substring(0, 2) === 'if') {
            console.log(block);
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
            console.log(matches);
            if (matches.length === 3) {
                parent = this.add(matches[0], parent, NodeType.Logic, onTrueSide);
                this.reverseDfp(matches[1], parent, true);
                this.reverseDfp(matches[2], parent, false);
            } else { throw new Error('improperly formatted if block detected: ' + block + '\n got matches ' + JSON.stringify(matches?.toString())) }
        } else if (/^[a-zA-Z0-9]+\(/.test(block)) {
            // wrapper case
            const wrappers = block.split('(');
            let wrapper = '';
            let ct = 0;
            for (let i = 0; i < wrappers.length; i++) {
                if (wrappers[i] === 'if') {
                    break;
                }
                wrapper += 'this.' + wrappers[i] + '(';
                ct += 1;
            }
            parent = this.add(wrapper, parent, NodeType.Wrapper, onTrueSide);
            this.reverseDfp(block.substring(wrapper.length - 5 * ct, block.length - ct), parent, onTrueSide);
        } else {
            // TODO handle ternaries
        }
    }
    /**
     * returns an array representation of the tree in a standard binary tree array
     */
    toArray() {
        const toRet = new Array<string>(this.size);
        this.arrHelper(this.root, toRet, 0);
        return toRet;
    }

    private arrHelper(node: Node, arr: Array<string>, index: number) {
        if (!node) { return; }
        arr[index] = node.statement;
        this.arrHelper(node.trueChild, arr, index * 2 + 1);
        this.arrHelper(node.falseChild, arr, index * 2 + 2);
    }
}

export class Node {
    public trueChild!: Node;
    public falseChild!: Node;
    public wrappedChildren!: Node[];
    public tail = '';

    constructor(public type: NodeType, public statement: string) {}
    
    addTrueChild(child: Node) {
        if (this.type !== NodeType.Logic) {
            throw new Error('cannot add child to return node')
        }
        this.trueChild = child;
    }

    addFalseChild(child: Node) {
        if (this.type !== NodeType.Logic) {
            throw new Error('cannot add false child to return node or wrapper node')
        }
        this.falseChild = child;
    }

    addWrappedChild(child: Node) {
        if (this.type !== NodeType.Wrapper) {
            throw new Error('cannot add false child to return node or wrapper node')
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
        this.statement = this.statement
            .replace(/this\./g, '')
            .replace(/&&/g, ' and ')
            .replace(/\|\|/g, ' or ')
            .replace(/!(?!==)/g, ' not ');
    }

    /**
     * replaces all references to db properties
     */
    public replaceProperties(propertyMap: {[key: string]: Property}): void {
        if (!this) return;
        // replace .value
        this.statement = this.statement.replace(/this\.(\w+)\.value/g, (_, property) => `prop("${(propertyMap)[property]?.propertyName}")`);
        // replace object method calls - if the property is a DB property then replace it, otherwise it's a builtin function call so just use it
        this.statement = this.statement.replace(/this\.(\w+)/g, (_, property) => (propertyMap)[property] ? `prop("${(propertyMap)[property]?.propertyName}")` : property);
        // remove all leftover .values
        this.statement = this.statement.replace(/\.value/g, '');

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
            this.statement = this.statement.replace(callback, parsedCallback);
        });
    }
}
