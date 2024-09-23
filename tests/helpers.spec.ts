import { getBlockContent, getCallbackStatement, getStatement, parseCallbackStatement } from '../src/helpers/helpers';

describe('helper functions', () => {
    describe('getBlockContent', () => {
        it('should get the content for a single if block', () => {
            expect(getBlockContent('if(x<y){a+b}else{b-a}')).toEqual(['a+b', 'b-a'])
        });

        it('should get the content for a singley nested if block', () => {
            expect(getBlockContent('if(x<y){if(y<z){z+1}else{z-1}}else{if(x<y){a+b}else{b-a}}')).toEqual(['if(y<z){z+1}else{z-1}', 'if(x<y){a+b}else{b-a}']);
        });

        it('should get the content for a doubley nested if block', () => {
            expect(getBlockContent('if(x<y){if(a>b){if(y<z){z+1}else{z-1}}else{1+1}}else{if(x<y){if(y<z){z+1}else{z-1}}else{if(x<y){a+b}else{b-a}}}')).toEqual(['if(a>b){if(y<z){z+1}else{z-1}}else{1+1}', 'if(x<y){if(y<z){z+1}else{z-1}}else{if(x<y){a+b}else{b-a}}']);
        });

        it('should get content for first block in sequence of several and provide "false" block as second array element', () => {
            expect(getBlockContent('if(x<y){if(a>b){if(y<z){z+1}else{z-1}}else{1+1}}else{3}')).toEqual(['if(a>b){if(y<z){z+1}else{z-1}}else{1+1}', '3']);
        });

        it('should get extended content for "false" element', () => {
            expect(getBlockContent('if(x<y){if(a>b){if(y<z){z+1}else{z-1}}else{1+1}}else{if(x<y){if(a>b){if(y<z){z+1}else{z-1}}else{1+1}}')).toEqual(['if(a>b){if(y<z){z+1}else{z-1}}else{1+1}', 'if(x<y){if(a>b){if(y<z){z+1}else{z-1}}else{1+1}']);
        });

        it('should handle else ifs', () => {
            expect(getBlockContent('if(x<y){a+b}elseif(x===y){b-a}else{b*a}')).toEqual(['a+b', 'if(x===y){b-a}else{b*a}'])
        });

        it('should handle parentheses in if functions', () => {
            expect(getBlockContent('if((x*y)+1<(3*x)+2){3}else{4}')).toEqual(['3', '4'])
        });

        it('should handle parentheses in return functions', () => {
            expect(getBlockContent('if(x===y){(x*y)+1<(3*x)+2}else{(x-y)*2+(3*x)*3}')).toEqual(['(x*y)+1<(3*x)+2', '(x-y)*2+(3*x)*3'])
        });

        it('should handle simple fall through if blocks', () => {
            expect(getBlockContent('if(test===1){1}2')).toEqual(['1', '2'])
        });

        it('should handle simple fall through if/else if blocks', () => {
            expect(getBlockContent('if(test===1){1}elseif(test===-1){3}2')).toEqual(['1', 'if(test===-1){3}2'])
        });

        it('should handle tails with elses', () => {
            expect(getBlockContent('if(x===y){4}else{2}*2')).toEqual(['4', '2}*2'])
        });

        it('should handle tails with else ifs', () => {
            expect(getBlockContent('if(x===y){4}elseif(a===b){3}else{2}*2')).toEqual(['4', 'if(a===b){3}else{2}*2'])
        });
    });

    describe('get statement', () => {
        it('should return the logic in parentheses for a logical staement', () => {
            expect(getStatement('if(test===true){do..stuff...here}')).toEqual('test===true')
        });

        it('should return the logic in parentheses for a logical staement when else if is present', () => {
            expect(getStatement('if(test===true)elseif{do..stuff...here}')).toEqual('test===true');
        });

        it('should return the logic in parentheses for a logical staement when else is present', () => {
            expect(getStatement('if(test===true)else{do..stuff...here}')).toEqual('test===true');
        });
        
        it('should return undefined in brackets for a return statement', () => {
            expect(getStatement('do..stuff...here')).toBeUndefined();
        });
    });

    describe('getCallbackStatement', () => {
        it('should get a callback', () => {
            const result = getCallbackStatement('if(1===1,prop("My Prop").map((index,current) => current.lower()), prop("My Prop"))');
            expect(result).toEqual(['(index,current) => current.lower()']);
        });

        it('should get multiple callback', () => {
            const result = getCallbackStatement('if(1===1,prop("My Prop").map((index,current) => current.lower()), prop("My Prop").filter((current) => current !== "test"))');
            expect(result).toEqual(['(index,current) => current.lower()', '(current) => current !== "test"']);
        });

        it('should replace this callback that it isnt for some reason', () => {
            const result = getCallbackStatement(`prop("formula").map((a,b)=>a===prop("formula").length()-1?"last value of list":b.lower())`);
            expect(result).toEqual(['(a,b)=>a===prop("formula").length()-1?"last value of list":b.lower()'])
        });
    });

    describe('parseCallback ', () => {
        it('should parse a callback', () => {
            const result = parseCallbackStatement('(current)=>current!=="test"');
            expect(result).toEqual('current!=="test"');
        });

        it('should replace a single variable callback', () => {
            const result = parseCallbackStatement('(weirdVariable)=>weirdVariable!=="test"');
            expect(result).toEqual('current!=="test"');
        });

        it('should replace a multi variable callback', () => {
            const result = parseCallbackStatement('(weirdVariable, otherWeirdVariable)=>weirdVariable+otherWeirdVariable');
            expect(result).toEqual('index+current');
        });

        it('does not replace non-variable references with the same name', () => {
            const result = parseCallbackStatement('(a,e)=>a.length()+e+"e e test"');
            expect(result).toEqual('index.length()+current+"e e test"');
        });
    });
});