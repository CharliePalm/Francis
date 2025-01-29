/* eslint-disable @typescript-eslint/no-explicit-any */

import { NodeType } from "../src/model";
import { Tree, Node } from "../src/helpers/tree";

describe('buildTree', () => {
    it('should correctly add the root and create a simple tree', () => {
        const formula = 'if(x-y){dostuff}else{elsedostuff}';
        const tree = new Tree(formula);
        expect(tree.root.statement).toEqual('x-y');
        expect(tree.root.trueChild?.statement).toEqual('dostuff');
        expect(tree.root.falseChild?.statement).toEqual('elsedostuff');
    });

    it('should throw error when an else block is missing', () => {
        const formula = 'if(x-y){if(a+b==0){dostuff}elseif(x-y===1){dostuff}}else{elsedostuff}';
        try {
            new Tree(formula);
        } catch (e: any) {
            expect(e.message).toEqual('error processing input: unexpected blank false block from true block: dostuff')
        }
    });

    it('should correctly create a complex tree', () => {
        const formula = 'if(x<y){if(a>b){if(y<z){z+1}else{z-1}}else{1+1}}else{if(x<y){if(y<z){z+1}else{z-1}}else{if(x===y){a+b}else{b-a}}}';
        const tree = new Tree(formula);
        let tc: Node, fc: Node;
        expect(tree.root.statement).toEqual('x<y');
        tc = tree.root.trueChild;
        expect(tc?.statement).toEqual('a>b');
        expect(tc.type).toEqual(NodeType.Logic);

        // true child
        tc = tc.trueChild;
        fc = tc.falseChild;
        expect(tc?.statement).toEqual('y<z');
        expect(tc?.type).toEqual(NodeType.Logic);

        expect(fc?.statement).toEqual('z-1');
        expect(fc?.type).toEqual(NodeType.Return);

        tc = tree.root.trueChild;
        fc = tc.falseChild;
        expect(fc?.statement).toEqual('1+1');
        expect(fc?.type).toEqual(NodeType.Return);

        // root false child
        fc = tree.root.falseChild;
        expect(fc?.statement).toEqual('x<y');
        expect(fc?.type).toEqual(NodeType.Logic);
        tc = fc.trueChild;
        expect(tc?.statement).toEqual('y<z');
        expect(tc?.type).toEqual(NodeType.Logic);
        fc = tc.falseChild;
        tc = tc.trueChild;
        expect(tc?.statement).toEqual('z+1');
        expect(tc?.type).toEqual(NodeType.Return);
        expect(fc?.statement).toEqual('z-1');
        expect(fc?.type).toEqual(NodeType.Return);

        fc = tree.root.falseChild;
        fc = fc.falseChild;
        expect(fc?.statement).toEqual('x===y');
        expect(fc?.type).toEqual(NodeType.Logic);
        expect(fc?.trueChild?.statement).toEqual('a+b');
        expect(fc?.trueChild?.type).toEqual(NodeType.Return);
        expect(fc?.falseChild?.statement).toEqual('b-a');
        expect(fc?.falseChild?.type).toEqual(NodeType.Return);
    });

    describe('getCombinationNodeChildren', () => {
        it('should correctly get combination node children', () => {
            const statement = 'if(a>b){1}else{2}+if(b==a){3}else{4}';
            const tree = new Tree();
            expect(tree['getCombinationNodeChildren'](statement)).toEqual(['if(a>b){1}else{2}', '+', 'if(b==a){3}else{4}']);
        });
        it('should correctly get combination node children for multiple children', () => {
            const statement = 'if(a>b){1}else{2}+if(b==a){3}else{4}-if(x-y>b){4}else{5}';
            const tree = new Tree();
            expect(tree['getCombinationNodeChildren'](statement)).toEqual(['if(a>b){1}else{2}', '+', 'if(b==a){3}else{4}', '-', 'if(x-y>b){4}else{5}']);
        });
        it('should handle one character children at the end of the statement', () => {
            const statement = 'if(a>b){1}else{2}+if(b==a){3}else{4}-if(x-y>b){4}else{5}+4';
            const tree = new Tree();
            expect(tree['getCombinationNodeChildren'](statement)).toEqual(['if(a>b){1}else{2}', '+', 'if(b==a){3}else{4}', '-', 'if(x-y>b){4}else{5}', '+', '4']);
        });
    });
});