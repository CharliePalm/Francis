# UPDATE 11/2023:
Notion has upgraded their formula API, and as such, Francis needs an update too. This is almost done, but I may have to sacrifice some ease of use for more difficult functionality.
The API has been changed to include object-esque references, and this leads to primitive operations breaking down if we define these object types. For example:

    // define DB property as being Notion's 'text' type:
    const myText = new Model.Text('');
    // ideally, we could both compare, and access the member methods of myText:
    myText.length(); // compiler should allow since length is a function call, not a property in the new API
    myText.
    const myOtherText = new Model.Text('');
    myOtherText === myText; // compiler should allow as we can compare strings in Notion
    myOtherText === 'test'; // compiler should allow as we can compare primitive strings in Notion

The third case is where my current implementation of the compiler is breaking down.
I've done some troubleshooting as defining a 'notion string type' as both the union and the intersection of the primitive string and the NotionString, but to no avail. 
I'm still working on this, just wanted to let everyone know that this is still in progress, and I haven't abandoned the project. If you have any suggestions here, let me know - as long as this header is on the readme I don't have a solution.

It's also possible that I'm overthinking this, and most people won't create formulas complex enough to utilize 100% of this functionality anyways, but I don't want users to be potentially held back from creating super complex formulas by anything.

# Francis

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

    git clone https://github.com/CharliePalm/NotionFormulaGenerator
    cd NotionFormulaGenerator
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

As the header above mentions, updates are still needed for full functionatliy with Notion's new API. The current release doesn't support most of the update.

## License
[MIT License](https://opensource.org/licenses/MIT) 
