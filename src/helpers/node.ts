import { NodeType, Property } from '../model';
import { getCallbackStatement, parseCallbackStatement } from './helpers';

export class Node {
  public trueChild!: Node;
  public falseChild!: Node;
  public wrappedChildren!: Node[];
  public tail = '';
  public nose = '';
  public nesting = false;

  constructor(
    public type: NodeType,
    public statement: string,
    public isReverse = false
  ) {}

  addTrueChild(child: Node) {
    if (this.type !== NodeType.Logic) {
      throw new Error('cannot add child to non logic node');
    }
    this.trueChild = child;
  }

  addFalseChild(child: Node) {
    if (this.type !== NodeType.Logic) {
      throw new Error('cannot add false child to non logic node');
    }
    this.falseChild = child;
  }

  addWrappedChild(child: Node) {
    if (this.type === NodeType.Return) {
      throw new Error('cannot add wrapped child to return  node');
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
    const replace = (str: string) =>
      str
        ?.replace(/this\./g, '')
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
    this.statement = this.statement?.replace(
      /this\.(\w+)\.value/g,
      (_, property) => `prop("${propertyMap[property]?.propertyName}")`
    );
    // replace object method calls - if the property is a DB property then replace it, otherwise it's a builtin function call so just use it
    this.statement = this.statement?.replace(/this\.(\w+)/g, (_, property) =>
      propertyMap[property]
        ? `prop("${propertyMap[property]?.propertyName}")`
        : property
    );
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
    if (!this.isReverse) {
      const callbacks = getCallbackStatement(this.statement);
      callbacks.forEach((callback) => {
        const parsedCallback = parseCallbackStatement(callback);
        this.statement = this.statement?.replace(callback, parsedCallback);
      });
    }
  }
}
