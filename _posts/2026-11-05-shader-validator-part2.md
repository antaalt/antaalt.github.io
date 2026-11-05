---
layout: post
lang: en
title: "Inside shader-validator"
subtitle: "Creating a language server for shaders, part 2: highlighting, diagnostics and symbols"
author: antaalt
image: '/assets/images/posts/shader-validator-part2/logo-shader-validator.png'
image-alt: 'shader validator logo'

---

In [part 1]({% post_url 2024-11-23-shader-language-server %}), I explained what a language server is and why I built [shader-validator](https://marketplace.visualstudio.com/items?itemName=antaalt.shader-validator), a language server for HLSL, GLSL and WGSL. Now I want to dive and show what's under the hood. A shader language server has three main jobs: coloring your code, telling you what is wrong with it, and understanding what is in it. I will go through how shader-validator handle that, and the issues I met on the way.

## Syntax highlighting

The project started with syntax highlighting. It might seem like a small thing, but the default highlighting for shaders in VS Code was quite poor and it almost felt like using Notepad (I see a lot of developer in the industry who loves using Notepad for shaders though. But I am not one of them). So I wrote better highlighting, closer to what you get with C++ and other well-supported languages. It was only the beginning, but it already made writing shaders a lot more enjoyable.

In VS Code, highlighting is defined with [TextMate grammars](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide) (`tmLanguage` files): a set of regular expressions that assign a scope to each token, which your theme then colors. Explaining how textmate works in detail could have its own post, but with a few regex expertise, thing can be done quickly.

Other editors take a different approach. Neovim, for example, uses tree-sitter for highlighting instead of TextMate grammars. But we will talk about tree-sitter again later.

## Diagnostics: let the compilers do the work

For validation, I chose not to write my own compiler. Shader-validator wraps the standard compilers directly:

- **DXC** for HLSL, through [hassle-rs](https://github.com/Traverse-Research/hassle-rs), the Rust bindings from Traverse Research.
- **glslang** for GLSL, through [glslang-rs](https://github.com/SnowflakePowered/glslang-rs).
- **Naga** for WGSL, which is written in Rust and is the shader translator of [wgpu](https://wgpu.rs/), with a huge community of contributors.

Because the server uses the same compilers as your build, its diagnostics match exactly what your compiler reports. Updating to a new compiler version is easy (well, sort of...), and new language features come for free. We have a lot of great tools in computer graphics, so why rewrite them? (Granted, building yet another shader extension is a bit like [adding a 15th standard](https://xkcd.com/927/)...)

And this way you can find funny things and fix them: Until 2024, glslang could not report the *column* of an error, only the line, which is a problem when a linter needs to underline the faulty word. The data was there, it just wasn't printed, so a change of about ten characters [fixed it](https://github.com/KhronosGroup/glslang/issues/3238). DXC and Naga were much more straightforward, thanks to hassle-rs bindings to DXC in Rust and to Naga being pure Rust.

## Symbols: understanding the code

Diagnostics tell you what is wrong. Features like hover, completion and go to definition need more: the server must know which functions, structs and variables your code contains, and where they are. Getting these symbols turned out to be the hardest part, because they need to be:

- **fast**, as they are queried while you type,
- **available even when the code does not compile**, which is exactly when you need help,
- **available for header files**, which have no entry point.

### Attempt 1: the compiler APIs

The first idea was to ask the compilers, since they already parse the code:

- **DXC** provides an IntelliSense API, but it doesn't fit these needs, and its future is [uncertain](https://github.com/microsoft/DirectXShaderCompiler/issues/5172).
- **glslang** can print its AST, but that means parsing its debug text output, which is inefficient, plus the format is not standardized and might change with every update.
- **Naga** has a neat API to read module information, which could have worked well for WGSL.

But all of them share the same problems: the code has to compile, entry points are not always reported correctly, and header files without an entry point cannot be handled at all. I needed another solution.

### Attempt 2: regular expressions

The next attempt was a simple custom set of regular expressions to find symbols in the code. But regex are heavy to create (same as tree-sitter tree and query though), and more troublesome to get right with everything. One interesting thing though would have been to be able to mutualize regex for text highlight through tmlanguage files and regex used for symbols. But it really fast became tedious: 
- You need to handle its scope
- If its inside a class
- If the syntax is valid
- And more
But tree-sitter came as a builtin solution with everything needed for getting symbols. Scopes and a lot more are all handled gracefully by great contributors.

### The solution: tree-sitter

What I really needed was an [AST (abstract syntax tree)](https://en.wikipedia.org/wiki/Abstract_syntax_tree) of the shader, kept up to date as you type. That is exactly what [tree-sitter](https://tree-sitter.github.io/tree-sitter/) does. It is a parser generator designed for editors (it's what Neovim uses by default):

- It parses **incrementally**: when you type, only the modified part of the tree is updated, which makes it fast enough for real-time use.
- It is **error tolerant**: it still produces a tree when the code is broken.
- It doesn't need **entry points**: a header file is just another file to parse.

Even better, the community had already done most of the work: tree-sitter grammars for HLSL, GLSL and WGSL already existed, with Rust bindings. It was plug and play! With a few [queries](https://tree-sitter.github.io/tree-sitter/using-parsers/queries/), shader-validator can efficiently retrieve functions, structs, variables and their locations from the tree.

Simple example: Here you run this query on tree-sitter tree, and you will get all struct, their name and there scope. You can then find all its member and function quite easily as you know the whole scope range.

```
(struct_specifier
    name: (type_identifier) @struct.type
    body: (field_declaration_list) @struct.content
)
```

## Why Rust?

Indeed, why not write the server in C++, like the compilers it wraps ? Because it's 2026, and I wanted a language with a decent package manager and memory safety. Rust also compiles easily to WASI, which is what lets shader-validator run on [vscode.dev](https://vscode.dev) (see [part 1]({% post_url 2024-11-23-shader-language-server %}) and [my post on compiling C++ to WASI]({% post_url 2024-10-17-cpp-to-wasi %})). And Naga is already written in Rust. And it will force me to contribute to the Rust ecosystem to make it a better place ! What else ?

## What's next

There is still a lot to do: better HLSL support, Slang and Metal, a shader debugger... I go through the roadmap in detail in [this post](TODO-link-to-shader-ecosystem).
