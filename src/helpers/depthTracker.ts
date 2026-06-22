export abstract class BaseDepthTracker {
  public index = -1;
  public inDoubleQuote = false;
  public inSingleQuote = false;
  public parenthesesDepth = 0;
  public bracketDepth = 0;

  constructor(public str: string) {}

  public get inQuote() {
    return this.inDoubleQuote || this.inSingleQuote;
  }

  public get depth() {
    return this.parenthesesDepth + this.bracketDepth;
  }

  public get length() {
    return this.str.length;
  }

  public get hasNext() {
    return this.index < this.str.length - 2;
  }

  public get currChar() {
    return this.relativeCharAt(0);
  }

  public get nextChar() {
    return this.relativeCharAt(1);
  }

  public get prevChar() {
    return this.relativeCharAt(-1);
  }

  /**
   * Returns a substring of the string, starting at the current position.
   * @param start
   * @param length
   * @returns the substring, or undefined if the indices are out of bounds
   */
  public substr(start: number, length?: number): string | undefined {
    length ??= Math.abs(start);
    if (
      start + this.index < 0 ||
      start + this.index + length > this.str.length
    ) {
      return undefined;
    }
    return this.str.substring(start + this.index, start + this.index + length);
  }

  /**
   * returns the char relative to the current position
   * @param offset the offset from the current position
   * @returns the character at the specified offset, or an empty string if the offset is out of bounds
   */
  public relativeCharAt(offset: number): string {
    return this.index + offset >= 0 && this.index + offset < this.length
      ? this.str[this.index + offset]
      : '';
  }

  /**
   * Advances the tracker to the next character.
   * @returns true if the tracker has next, otherwise false
   */
  abstract inc(): boolean;
}

export class DepthTracker extends BaseDepthTracker {
  constructor(str: string) {
    super(str);
  }

  inc(): boolean {
    this.index += 1;
    if (this.index >= this.str.length) {
      return false;
    }

    if (this.currChar === '"' || this.currChar === "'") {
      if (this.currChar === '"')
        this.inDoubleQuote = this.inSingleQuote
          ? this.inDoubleQuote
          : !this.inDoubleQuote;
      if (this.currChar === "'")
        this.inSingleQuote = this.inDoubleQuote
          ? this.inSingleQuote
          : !this.inSingleQuote;
    } else if (this.inQuote || this.currChar === ' ') {
      return true;
    }

    if (!this.inQuote) {
      this.bracketDepth += Number(this.currChar === '{');
      this.parenthesesDepth += Number(this.currChar === '(');
      this.bracketDepth -= Number(this.currChar === '}');
      this.parenthesesDepth -= Number(this.currChar === ')');
    }
    return true;
  }
}
