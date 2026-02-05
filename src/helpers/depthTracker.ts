export class DepthTracker {
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
    return this.index >= 0 && this.index < this.length
      ? this.str[this.index]
      : '';
  }

  public get nextChar() {
    return this.hasNext ? this.str[this.index + 1] : '';
  }

  public get lastChar() {
    return this.index >= 1 ? this.str[this.index - 1] : '';
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
