import { NodeType, Property } from '../../model';
import { getBlockContent, getCallbackStatement, getStatement, parseCallbackStatement } from './helpers';

/**
 * this class is a binary tree representing the flow of logic
 */
export class Tree {
    root!: Node;
    size = 0;
    constructor(formula?: string) {
        if (formula) this.dfp(formula, undefined)
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
            isTrueChild ?
                parent.addTrueChild(node) :
                parent.addFalseChild(node);
        }
        this.size += 1;
        return node;
    }

    /**
     * executes depth first propagation from right to left
     * right -> true statement. left -> false statement
     * @param block
     */
    dfp(block: string, parent: Node | undefined, onTrueSide?: boolean) {
        const statement = getStatement(block);
        // no statement implies that getBlockContent returned our statement for us
        if (!statement) {
            // return case
            this.add(block, parent, NodeType.Return, onTrueSide);
            return;
        } else if (statement == block) {
            // wrapper function case
            let bottomPtr = 0, topPtr = 0, depth = 0;
            let parsedStatement = '';
            const children: string[] = [];
            while (topPtr < statement.length) {
                if (statement[topPtr] == '(') {
                    depth++;
                    if (depth == 1) {
                        parsedStatement += statement.substring(bottomPtr, topPtr + 1)+')';
                        bottomPtr = topPtr + 1;
                    }
                } else if (statement[topPtr] == ')') {
                    if (depth == 1) {
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
            })
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
            .replace(/!(?!=)/g, ' not ');
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
