import { NodeType } from '../model';
import { getBlockContent, getStatement } from './helpers';

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
            this.add(block, parent, NodeType.Return, onTrueSide);
            return;
        }
        const node = this.add(statement, parent, NodeType.Logic, onTrueSide);
        const [t, f] = getBlockContent(block);
        this.dfp(t, node, true);
        if (!f) {
            throw new Error('error processing input: every if block requires a paired else block');
        }
        this.dfp(f, node, false);
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
    constructor(public type: NodeType, public statement: string) {}

    addTrueChild(child: Node) {
        if (this.type !== NodeType.Logic) {
            throw new Error('cannot add child to return node')
        }
        this.trueChild = child;
    }

    addFalseChild(child: Node) {
        if (this.type !== NodeType.Logic) {
            throw new Error('cannot add child to return node')
        }
        this.falseChild = child;
    }
}