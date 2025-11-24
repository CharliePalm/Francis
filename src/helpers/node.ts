import { NodeType, Property } from '../model';
import { getCallbackStatement, parseCallbackStatement } from './helpers';

export class Node {
  public trueChild!: Node;
  public falseChild!: Node;
  public logicChild!: Node;
  public wrappedChildren!: Node[];
  public tail = '';
  public nose = '';
  public nesting = false;

  constructor(
    public type: NodeType,
    public rawStatement: string,
    public isReverse = false
  ) {
    rawStatement = rawStatement.trim();
  }

  public get statement() {
    return this.nose + this.rawStatement + this.tail;
  }

  public get children() {
    return [this.logicChild, this.trueChild, this.falseChild]
      .concat(this.wrappedChildren)
      .filter(Boolean);
  }

  addLogicChild(child: Node) {
    if (this.type !== NodeType.Logic) {
      throw new Error('cannot add logic child to non logic node');
    }
    this.logicChild = child;
  }

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
    this.rawStatement = replace(this.rawStatement);
    this.nose = replace(this.nose);
    this.tail = replace(this.tail);
  }

  /**
   * replaces all references to db properties
   */
  public replaceProperties(propertyMap: Record<string, Property>): void {
    if (!this) return;
    // replace .value
    this.rawStatement = this.rawStatement?.replace(
      /this\.(\w+)\.value/g,
      (_, property) => `prop("${propertyMap[property]?.propertyName}")`
    );
    // replace object method calls - if the property is a DB property then replace it, otherwise it's a builtin function call so just use it
    this.rawStatement = this.rawStatement?.replace(
      /this\.(\w+)/g,
      (_, property) =>
        propertyMap[property]
          ? `prop("${propertyMap[property]?.propertyName}")`
          : property
    );
    // remove all leftover .values
    this.rawStatement = this.rawStatement?.replace(/\.value/g, '');

    this.replaceFunctionsAndOperators();
    this.replaceCallbacks();
    this.children.forEach((child) => {
      child.replaceProperties(propertyMap);
    });
  }

  private replaceCallbacks(): void {
    if (!this.isReverse) {
      const callbacks = getCallbackStatement(this.statement);
      callbacks.forEach((callback) => {
        const parsedCallback = parseCallbackStatement(callback);
        this.rawStatement = this.rawStatement?.replace(
          callback,
          parsedCallback
        );
      });
    }
  }
}
