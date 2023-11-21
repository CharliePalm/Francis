# Francis

(updated to support Notion's new formula API!)

F.R.A.N.C.I.S. (Formula Readability And Notion Compilation Improvement Stack) is a somewhat complicated but powerful and programmer friendly way of getting around the difficulty of writing large formulas in Notion. 

With this tool you can simply write thoroughly compile/type checked typescript logic (with all of Notion's builtin functions) and have it translated to a formula quick and easy!

Above all, this is a pretty inefficient 'compiler' in the sense that it converts high level code (typescript) into low level code (notion formula). This is particularly difficult because unlike machine-level code, our low level code isn't technically a programming language.

It does so through these steps:

1. Build the function map of any helper methods
2. Clean the text of the formula function: remove the return keyword, comments, whitespace, semicolons, etc. and replace typescript syntax with notion syntax (&& becomes and, etc.)
3. Replace all constants with their values
4. Build a binary tree of logic
5. Replace all DB property references with the property's name
6. Replace all function calls with their code
7. Iterate over the tree's nodes from left to right (true to false) to build the tree
8. Return the completed formula

## Usage

This usage guide assumes basic programming proficiency. You don't really need to be a typescript expert but you should be familiar with the concepts of basic logic and polymorphism

    git clone https://github.com/CharliePalm/Francis
    cd Francis
    npm i
Open the provided myFirstFormula file, and run
    
    ts-node myFirstFormula.ts
you should see the result:

    if(prop("myProperty name"),1,0)
Now that you've confirmed that everything is running smoothly, you can start creating your own formula. You can check out the example file at example.ts for a complicated formula example that uses all the functionality of the compiler, or just fill in the myFirstFormula.ts file with all the functionality you need.

DB properties should be defined as they are in the example file. It doesn't matter what you name the variable, but the string you pass in to the constructor MUST be the name of the property. That is to say, in the following example code:

    class Formula extends NotionFormulaGenerator {
        public test = new Model.Number('test2')
    }
test2 is the name of the database property, not test.

Requirements for creating your formula() function:

1. Using let is prohibited. You are allowed to define NOTION FRIENDLY constants (such as strings and numbers) to improve readability, but all must be defined with the const keyword
2. Trailing commas are not allowed
3. Empty if blocks are not allowed
4. Loops are not allowed
5. Function parameters are not allowed
6. Global variables are not allowed

Aside from these exceptions, if typescript compiles you should be good to go.

Note that when adding functions you must create a mapping function to communicate to the compiler what functions to replace with what code. The parent class itself cannot effectively bind each method of the child class at compile time so it's necessary to add this yourself. See the examples in myFirstFormula.ts or example.ts.

You are allowed to reference other functions within helper functions, but cannot use recursion or call to the formula() method. This includes multi method recursion; the chain of method calls cannot contain a cycle.

If you want to wrap logic in a function call, just execute the logic in a helper function and call it within the function you want to use as the wrapper.
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

# New in v2.0

Francis has been updated to support Notion's new formula API. This means that you can now utilize object references, callback functions, and update your formulas to be supported by the newest version. Using object references is simple, though does change some ways that Francis needs to be used.

Because DB properties are now treated as objects, if you wish to do any primitive operations, you need to use the .value field on the object (being either a DB property or the return from a function). Otherwise, you can use the object itself as input for things like functions parameters.

Notion also changed some minor things about its builtins - for example: e and pi are now function calls instead of constants, lists have their own functions, concat takes lists, etc.

Since they now allow new lines, comments, and other such conveniences, the main purpose of this tool has transitioned into more of a complexity manager. Things like helper function and constant declaration will make writing exceptionally complex formulas much simpler and lead to significant readability improvements. See example.ts for my task scheduler algorithm - it uses two sigmoid functions that are contained in function calls. 

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

Submit a pull request (with unit test coverage please) and I'll happily review it. Otherwise you're free to fork and use as you will for your own PERSONAL purposes. If you use a formula generated by this tool for something that isn't exclusively for yourself please, at the bare minimum give it a shout-out :)

## Known Bugs

As of 8/5/2023 there are no known bugs.

## Reporting Bugs

If you suspect you've encountered a bug with the codebase and NOT your implementation of it, please submit an issue with the typescript file containing your formula as well as the issue you're seeing.

## Future Plans

As of now, the only future plan I'm looking to add is a more robust generic typing interface that's both strict and adaptable so as to properly utilize Notion's 2.0 formula API object-esque references. Because I wanted users to be able to utilize this functionality, I had to make some decisions regarding primitive vs objective reference types. In the end, any Notion object
contains a value field that has its primitive type (if applicable) for primitive comparisons and function input, but it could potentially be more user friendly to forego that and completely rely on object comparisons.
This brings into question how type safety will be properly enforced and how primitive operations can be carried out, which I don't have a solution for right now, but would like to work more on.

## License
[MIT License](https://opensource.org/licenses/MIT) 
