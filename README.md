# Formula Generator

Have you ever been writing a complicated formula in Notion and thought to yourself: "man, this sucks! I wish there was literally any other way I could do this"?
Well you're in luck, because this is a somewhat complicated but programmer friendly way of getting around the problematic syntax of Notion's formula API.
With this tool you can simply write thoroughly compile checked typescript logic (with all of Notion's builtin functions) and have it translated to a formula quick and easy!

Above all, this is a pretty inefficient 'compiler' in the sense that it converts high level code (typescript) into low level code (notion formula). This is particularly difficult because unlike machine-level code, our low level code isn't technically even a programming language.

## Usage

This usage guide assumes basic programming proficiency. You don't really need to be a typescript expert but you should be familiar with the concepts of basic logic and polymorphism

    git clone https://github.com/CharliePalm/NotionFormulaGenerator
    cd NotionFormulaGenerator
    npm i
Now create a typescript file and create your class based on the provided example, or just use the example file and replace with your DB properties and logic, then run
    
    ts-node MyFile.ts

Requirements for creating your formula() function:

1. Using let is prohibited. You are allowed to define NOTION FRIENDLY constants (such as strings and numbers) to improve readability, but all must be defined with the const keyword
2. Trailing commas are not allowed
3. Ternary operators are not currently allowed but will be in a future release
4. Empty if blocks are not allowed
5. Loops are not allowed
6. Function parameters are forbidden
7. Global variables are forbidden

Aside from these exceptions, if typescript compiles you should be good to go.

Note that when adding functions you must create a mapping function to communicate to the compiler what functions to replace with what code. The parent class itself cannot effectively bind each method of the child class at compile time so it's necessary to add this yourself. See the example in MyFirstFormula.ts.

You are allowed to reference other functions within helper functions, but cannot use recursion or call to the formula() method. This includes multi method recursion - the chain of method calls cannot contain a cycle.

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

Above all, this isn't a full complier and shouldn't be treated as such, as the capabilities of Notion formulas are fairly limited. It would be wonderful if the API allowed loops over rollups or dynamic variable definition, it's just not currently possible, and thus I don't see any use cases for things like loops or non-constant variables.

## FAQ

"Why typescript?"\
I chose typescript for this because of the well rounded interface and class typing infrastructure. The main purpose of this codebase is type checking, so typescript seemed a natural choice therefrom.

"My code doesn't work"\
Make sure that you followed the usage guide and are correctly invoking your subclass' compile function. If you think there is an issue with the codebase itself, feel free to report an issue (see the Reporting Bugs section). I would recommend making small changes to the sample code first before forging on your own.

"This is too complicated. How am I supposed to make sense of all the rules and requirements?"\
Much of the code's needless complexity is itself reliant upon Notion's API. Mitigating this would be incredibly difficult and something I do not currently have the time for. In addition, the point of this tool is to make complex formulas, and complexity in creating them is thereby innate.

"Can I buy you a coffee?"\
You sure can :)\
<a href="https://www.buymeacoffee.com/charliepalm" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

## Contributing

Submit a pull request (with unit test coverage please) and I'll happily review it. Otherwise you're free to fork and use as you will.

## Known Bugs

As of 8/5/2023 there are no known bugs.

## Reporting Bugs

If you suspect you've encountered a bug with the codebase and NOT your implementation of it, please submit an issue with the typescript file containing your formula as well as the issue you're seeing.

## Future Plans

If at all possible, I would like to expand the usage of variable definition, helper function invocation, and other such tools that Notion doesn't support.
Doing so is going beyond a translator and quickly becoming a compiler but that's the one thing that I feel could really expand this project, though currently I have no plans or ideas on how to efficiently implement this.

## License
[MIT License](https://opensource.org/licenses/MIT) 
