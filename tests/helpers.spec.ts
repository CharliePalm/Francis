import {
  getCallbackStatement,
  getCombinationNodeChildren,
  getLogicChildren,
  parseCallbackStatement,
} from '../src/helpers/helpers';

describe('helper functions', () => {
  describe('getLogicChildren', () => {
    it('should get the content for a single if block', () => {
      expect(getLogicChildren('if(x<y){a+b}else{b-a}')).toEqual([
        'x<y',
        'a+b',
        'b-a',
      ]);
    });

    it('should get the content for a singly nested if block', () => {
      expect(
        getLogicChildren(
          'if(x<y){if(y<z){z+1}else{z-1}}else{if(x<y){a+b}else{b-a}}'
        )
      ).toEqual(['x<y', 'if(y<z){z+1}else{z-1}', 'if(x<y){a+b}else{b-a}']);
    });

    it('should get the content for a doubly nested if block', () => {
      expect(
        getLogicChildren(
          'if(x<y){if(a>b){if(y<z){z+1}else{z-1}}else{1+1}}else{if(x<y){if(y<z){z+1}else{z-1}}else{if(x<y){a+b}else{b-a}}}'
        )
      ).toEqual([
        'x<y',
        'if(a>b){if(y<z){z+1}else{z-1}}else{1+1}',
        'if(x<y){if(y<z){z+1}else{z-1}}else{if(x<y){a+b}else{b-a}}',
      ]);
    });

    it('should get content for first block in sequence of several and provide "false" block as second array element', () => {
      expect(
        getLogicChildren(
          'if(x<y){if(a>b){if(y<z){z+1}else{z-1}}else{1+1}}else{3}'
        )
      ).toEqual(['x<y', 'if(a>b){if(y<z){z+1}else{z-1}}else{1+1}', '3']);
    });

    it('should get extended content for "false" element', () => {
      expect(
        getLogicChildren(
          'if(x<y){if(a>b){if(y<z){z+1}else{z-1}}else{1+1}}else{if(x<y){if(a>b){if(y<z){z+1}else{z-1}}else{1+1}}'
        )
      ).toEqual([
        'x<y',
        'if(a>b){if(y<z){z+1}else{z-1}}else{1+1}',
        'if(x<y){if(a>b){if(y<z){z+1}else{z-1}}else{1+1}',
      ]);
    });

    it('should handle else ifs', () => {
      expect(
        getLogicChildren('if(x<y){a+b}elseif(x===y){b-a}else{b*a}')
      ).toEqual(['x<y', 'a+b', 'if(x===y){b-a}else{b*a}']);
    });

    it('should handle parentheses in if functions', () => {
      expect(getLogicChildren('if((x*y)+1<(3*x)+2){3}else{4}')).toEqual([
        '(x*y)+1<(3*x)+2',
        '3',
        '4',
      ]);
    });

    it('should handle parentheses in return functions', () => {
      expect(
        getLogicChildren('if(x==y){(x*y)+1<(3*x)+2}else{(x-y)*2+(3*x)*3}')
      ).toEqual(['x==y', '(x*y)+1<(3*x)+2', '(x-y)*2+(3*x)*3']);
    });

    xdescribe('fallthroughs', () => {
      // deprecated - fallthroughs are removed in the initial replace step
      it('should handle simple fall through if blocks', () => {
        expect(getLogicChildren('if(test===1){1}2')).toEqual([
          'test===1',
          '1',
          '2',
        ]);
      });

      it('should handle simple fall through if/else if blocks', () => {
        expect(
          getLogicChildren('if(test===1){1}elseif(test===-1){3}2')
        ).toEqual(['test===1', '1', 'if(test===-1){3}2']);
      });
    });
  });

  describe('getCallbackStatement', () => {
    it('should get a callback', () => {
      const result = getCallbackStatement(
        'if(1===1,prop("My Prop").map((index,current) => current.lower()), prop("My Prop"))'
      );
      expect(result).toEqual(['(index,current) => current.lower()']);
    });

    it('should get multiple callback', () => {
      const result = getCallbackStatement(
        'if(1===1,prop("My Prop").map((index,current) => current.lower()), prop("My Prop").filter((current) => current !== "test"))'
      );
      expect(result).toEqual([
        '(index,current) => current.lower()',
        '(current) => current !== "test"',
      ]);
    });

    it('should replace this callback that it isnt for some reason', () => {
      const result = getCallbackStatement(
        `prop("formula").map((a,b)=>a===prop("formula").length()-1?"last value of list":b.lower())`
      );
      expect(result).toEqual([
        '(a,b)=>a===prop("formula").length()-1?"last value of list":b.lower()',
      ]);
    });
  });

  describe('parseCallback ', () => {
    it('should parse a callback', () => {
      const result = parseCallbackStatement('(current)=>current!=="test"');
      expect(result).toEqual('current!=="test"');
    });

    it('should replace a single variable callback', () => {
      const result = parseCallbackStatement(
        '(weirdVariable)=>weirdVariable!=="test"'
      );
      expect(result).toEqual('current!=="test"');
    });

    it('should replace a multi variable callback', () => {
      const result = parseCallbackStatement(
        '(weirdVariable, otherWeirdVariable)=>weirdVariable+otherWeirdVariable'
      );
      expect(result).toEqual('index+current');
    });

    it('does not replace non-variable references with the same name', () => {
      const result = parseCallbackStatement('(a,e)=>a.length()+e+"e e test"');
      expect(result).toEqual('index.length()+current+"e e test"');
    });
  });

  describe('getCombinationNodeChildren', () => {
    it('should correctly get combination node children', () => {
      const statement = 'if(a>b){1}else{2}+if(b==a){3}else{4}';
      expect(getCombinationNodeChildren(statement)).toEqual([
        'if(a>b){1}else{2}',
        '+',
        'if(b==a){3}else{4}',
      ]);
    });
    it('should correctly get combination node children for multiple children', () => {
      const statement =
        'if(a>b){1}else{2}+if(b==a){3}else{4}-if(x-y>b){4}else{5}';
      expect(getCombinationNodeChildren(statement)).toEqual([
        'if(a>b){1}else{2}',
        '+',
        'if(b==a){3}else{4}',
        '-',
        'if(x-y>b){4}else{5}',
      ]);
    });
    it('should handle one character children at the end of the statement', () => {
      const statement =
        'if(a>b){1}else{2}+if(b==a){3}else{4}-if(x-y>b){4}else{5}+4';
      expect(getCombinationNodeChildren(statement)).toEqual([
        'if(a>b){1}else{2}',
        '+',
        'if(b==a){3}else{4}',
        '-',
        'if(x-y>b){4}else{5}',
        '+',
        '4',
      ]);
    });
    it('should properly handle a <= or >= operator', () => {
      const statement = '1+if(this.myProperty,1,0)>=0';
      expect(getCombinationNodeChildren(statement)).toEqual([
        '1',
        '+',
        'if(this.myProperty,1,0)',
        '>=',
        '0',
      ]);
    });
  });
});
