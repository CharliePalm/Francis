import {
  getCallbackStatement,
  getEndOfIfBlockIndex,
  getLogicChildren,
  getStatement,
  parseCallbackStatement,
} from '../src/helpers/helpers';

describe('helper functions', () => {
  describe.only('getLogicChildren', () => {
    it('should get the content for a single if block', () => {
      expect(getLogicChildren('if(x<y){a+b}else{b-a}')).toEqual([
        'x<y',
        'a+b',
        'b-a',
      ]);
    });

    it('should get the content for a singley nested if block', () => {
      expect(
        getLogicChildren(
          'if(x<y){if(y<z){z+1}else{z-1}}else{if(x<y){a+b}else{b-a}}'
        )
      ).toEqual(['x<y', 'if(y<z){z+1}else{z-1}', 'if(x<y){a+b}else{b-a}']);
    });

    it('should get the content for a doubley nested if block', () => {
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

  describe('getStatement', () => {
    it('should return the logic in parentheses for a logical staement', () => {
      expect(getStatement('if(test===true){do..stuff...here}')).toEqual(
        'test===true'
      );
    });

    it('should return the logic in parentheses for a logical staement when else if is present', () => {
      expect(getStatement('if(test===true)elseif{do..stuff...here}')).toEqual(
        'test===true'
      );
    });

    it('should return the logic in parentheses for a logical staement when else is present', () => {
      expect(getStatement('if(test===true)else{do..stuff...here}')).toEqual(
        'test===true'
      );
    });

    it('should return undefined in brackets for a return statement', () => {
      expect(getStatement('do..stuff...here')).toBeUndefined();
    });

    it('should return correct statement when provided a nested if', () => {
      expect(
        getStatement('if((if(1==1){1}else{2})>1){"hello"}"world"')
      ).toEqual('(if(1==1){1}else{2})>1');
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

  describe('getEndOfIfBlockIndex', () => {
    it('gets the first index of { after if block', () => {
      const result = getEndOfIfBlockIndex('if(1==1){"hello"}"world"');
      expect(result).toEqual(8);
    });

    it('gets the first index of { after if block for nested ifs', () => {
      const result = getEndOfIfBlockIndex(
        'if((if(1==1){1}else{2})>1){"hello"}"world"'
      );
      expect(result).toEqual(26);
    });
  });
});
