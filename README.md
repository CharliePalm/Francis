# Francis (Notion Formula Generator)
[![npm](https://img.shields.io/badge/npm-v2.0.4-blue)](https://www.npmjs.com/package/notion-formula-generator)
[![License](https://img.shields.io/badge/license-MIT-purple)](https://opensource.org/licenses/MIT)
[![Author](https://img.shields.io/badge/author%20-%20Charlie_Palm-Green)](https://github.com/polioan)

(updated to support Notion's new formula API!)

F.R.A.N.C.I.S. (Formula Readability And Notion Compilation Improvement Stack) is a somewhat complicated but powerful and programmer friendly way of getting around the difficulty of writing large formulas in Notion.

With this tool you can simply write thoroughly compile/type checked typescript logic (with all of Notion's builtin functions) and have it translated to a formula quick and easy!

Above all, this is a pretty inefficient 'compiler' in the sense that it converts high level code (typescript) into low level code (notion formula). This is particularly difficult because unlike machine-level code, our low level code isn't technically a programming language.

It does so through these steps:

1. Build the function map of any helper methods
2. Clean the text of the formula function: remove the return keyword, comments, whitespace, semicolons, etc. and replace typescript syntax with notion syntax (&& becomes and, etc.)
3. Replace all constants with their values
4. Build a (mostly) binary tree of logic
5. Replace all DB property references with the property's name
6. Replace all function calls with their code
7. Iterate over the tree's nodes from left to right (true to false) to build the tree
8. Return the completed formula

## Usage
This guide assumes basic programming proficiency. You don't really need to be a typescript expert but you should be familiar with the concepts of basic logic and polymorphism

### With npm
Generate a new typescript project:

    cd path/to/project
    npm init
    npm i notion-formula-generator

Then create a MyFirstFormula.ts file that looks something like this:

    import { NotionFormulaGenerator, Model } from 'notion-formula-generator'
    class MyFirstFormula extends NotionFormulaGenerator {
        // define DB properties here:
        public myProperty = new Model.Checkbox('myProperty name');

        // fill in your formula function here:
        formula() {
            if (this.myProperty) {
                return 1;
            }
            return 0;
        }
        
        // any frequently re-used logic can be compartmentalized into functions
        nameOfFunction() {
            return 0;
        }

        // If you want to use helper functions, define them here like this
        public buildFunctionMap(): Map<string, string> {
            return new Map([
                ['nameOfFunction', this.nameOfFunction.toString()],
            ]);
        }
    }

    const formula = new MyFirstFormula();
    console.log('result: ');
    console.log(formula.compile());
Then just add your formula and parameters and you can run

    npx ts-node formulas/MyFirstFormula.ts
Easy peasy!

### with the whole repo (Recommended):
Because the process for generating formulas is somewhat confusing, it's helpful to have the whole repo at your disposale to view the examples.

    git clone https://github.com/CharliePalm/Francis
    cd Francis
    npm i
Open the provided myFirstFormula file, and run

    npx ts-node myFirstFormula.ts
you should see the result:

    if(prop("myProperty name"),1,0)
Now that you've confirmed that everything is running smoothly, you can start creating your own formula. You can check out the example file at example.ts for a complicated formula example that uses all the functionality of the compiler, or just fill in the MyFirstFormula.ts file with all the functionality you need.

### General Guidelines
DB properties should be defined as they are in the example. It doesn't matter what you name the variable, but the string you pass in to the constructor MUST be the name of the property. That is to say, in the following example code:

    class Formula extends NotionFormulaGenerator {
        public test = new Model.Number('test2')
    }
test2 is the name of the database property, not test.

Requirements for creating your formula() function:

1. Using let is prohibited. You are allowed to define NOTION FRIENDLY constants (such as strings and numbers) to improve readability, but all must be defined with the const keyword. Furthermore, constants must be defined STATICALLY, i.e. they cannot be the result of a helper function call.
2. Trailing commas are not allowed
3. Empty if blocks are not allowed
4. Loops are not allowed
5. Function parameters are not allowed
6. Global variables are not allowed
7. Switch statements are not allowed

Aside from these exceptions, if typescript compiles you should be good to go.

Note that when adding functions you must create a mapping function to communicate to the compiler what functions to replace with what code. The parent class itself cannot effectively bind each method of the child class at compile time so it's necessary to add this yourself. See the examples in myFirstFormula.ts or example.ts.

You are allowed to reference other functions within helper functions, but cannot use recursion or call to the formula() method. This includes multi method recursion; the chain of method calls cannot contain a cycle, and the compiler will let you know if it encounters one.

If you want to wrap logic in a function call (i.e. rounding the result of a calculation), just execute the logic in a helper function and call it within the function you want to use as the wrapper.
For example:

    formula() {
        this.round(this.doSomething() * 100) / 100
    }

    doSomething() {
        if (1 == 1) {
            return 7 / 2;
        } else {
            return 9 / 4;
        }
    }
Which effectively translates to:

    round(if(1==1, 7/2, 9/4) * 100) / 100
Alternatively, you can use ternary operators to the same effect:

    formula() {
        this.round((1 == 1 ? 7/2 : 9/4) * 100) / 100
    }
Which will lead to the same result, just with ternaries instead of the notion if() function.

Above all, this isn't a full complier and shouldn't be treated as such, as the capabilities of Notion formulas are fairly limited. It would be wonderful if the API allowed loops over rollups or dynamic variable definition, it's just not currently possible, and thus I don't see any use cases for things like loops or non-constant variables.

## New in v2.0.4
A ton of bugs have been fixed and functionality added, including:

1. Francis now supports calling helper functions in logic statements, i.e. if (myFunction() == 1)
2. Francis can handle when multiple helper functions are separated by operators, i.e. myFunction() + myFunction()
3. Added a NotionObject type with a _valueAccessor method that can be typed generically to access relation properties

More on the above: if you have a relation and are trying to access a property from a row in your relation, you can do so as such:

    this.myRelation.find((r) => r.value == 'test')._valueAccessor('MyPropertyName').value
which translates to:

    prop("myRelation").find(current.value == 'test').prop("myPropertyName")
Furthermore, relations and rollups are automatically typed as being NotionObjects, but you can override this if your relation/rollup is something else.

## FAQ

"Why typescript?"\
I chose typescript for this because of the well rounded interface and class typing infrastructure. The main purpose of this codebase is type checking, so typescript seemed a natural choice therefrom.

"My code doesn't work"\
Make sure that you followed the usage guide and are correctly invoking your subclass' compile function. If you think there is an issue with the codebase itself, feel free to report an issue (see the Reporting Bugs section). I would recommend making small changes to the sample code first before forging on your own.

"This is too complicated. How am I supposed to make sense of all the rules and requirements?"\
Much of the code's needless complexity is itself reliant upon Notion's API. Mitigating this would be incredibly difficult and something I do not currently have the time for. In addition, the point of this tool is to make complex formulas, and complexity in creating them is thereby innate.

"Why is the compiler unhappy that I'm comparing a formula property with a number/string/boolean/date?"\
Typescript requires you to cast the variable (i.e. using the builtin toNumber or format methods) when dealing with formula variables because they technically could be of any type. Though this may be annoying, I'd recommend just creating a helper function that converts to your desired type so you don't have to keep doing it.

"Can I buy you a coffee?"\
You sure can :)\
<a href="https://www.buymeacoffee.com/charliepalm" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

## Contributing

Submit a pull request (with unit test coverage please) and I'll happily review it. Otherwise you're free to fork and use as you will for your own PERSONAL purposes. If you use a formula generated by this tool for something that isn't exclusively for yourself please, at the bare minimum give francis a shout-out :)

## Known Bugs

There's a bug that causes Francis to short circuit when there are multiple extremely complicated helper function calls in if statements. I've been able to get around it, but please submit a bug report if you're able to replicate.

There's an issue with Notion that arises when pasting extremely complicated formulas in from Francis where prop("property name") fields aren't read correctly. I've gotten around this by just typing a space after pasting.

## Reporting Bugs

If you suspect you've encountered a bug with the codebase and NOT your implementation of it, please submit an issue with the typescript file containing your formula as well as the issue you're seeing.

## Future Plans

As of now, the only future plan I'm looking to add is a more robust generic typing interface that's both strict and adaptable so as to properly utilize Notion's 2.0 formula API object-esque references. Because I wanted users to be able to utilize this functionality, I had to make some decisions regarding primitive vs objective reference types. In the end, any Notion object
contains a value field that has its primitive type (if applicable) for primitive comparisons and function input, but it could potentially be more user friendly to forego that and completely rely on object comparisons.
This brings into question how type safety will be properly enforced and how primitive operations can be carried out, which I don't have a solution for right now, but would like to work more on.

## License
[MIT License](https://opensource.org/licenses/MIT)
