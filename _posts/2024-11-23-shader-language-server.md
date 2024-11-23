---
layout: post
lang: en
title: "How to write a language server"
subtitle: "Creating a language server with language server protocol for vscode"
author: Antoine
image: '/assets/images/posts/shader-validator-part1/vscode.png'
image-alt: 'vscode logo'

---

Notepad is probably not the best tool for writing code. We use IDE because they provide helpers for us to write code such as syntax highlighting, code completion... And as easy as it look, the logic for this vary a lot from one language to another. So we need to write some code for each language to help us writing code. How can we do this ? There is multiple solutions, but one that is mostly standing out of the others is a language server.

# What is a language server

A language server is a server (duh) that will be responsible of helping programmer by providing him some helpful features. This kind of feature could be:

- Diagnostic: Send some feedback about the code you are writing.

![diagnostic](/assets/images/posts/shader-validator-part1/diagnostic.png)

- Hover: Provide some informations when you hover your cursor at some point in your code

![hover](/assets/images/posts/shader-validator-part1/hover.png)

- Completion: provide you some code as you type

![completion](/assets/images/posts/shader-validator-part1/completion.png)

- Goto: when clicking on a symbol, find its definition & go to it.

![goto](/assets/images/posts/shader-validator-part1/goto.png)

- A lot more...

These features are not automatic, and you need code to analyze what you are writing and interpret it as you type. Thats what a language server does. As its a server, we will need a client, which will be most of the time an extension in your favorite IDE.

You can find some famous language server extension such as [rust analyzer](https://rust-analyzer.github.io/) for Rust.

But instead of writing your own client / server protocol, why not use something that already exist and is supported by some IDE already ? This is [language server protocol](https://microsoft.github.io/language-server-protocol/), or lsp as some call it and that is what rust analyzer is based on. 

# Language server protocol (LSP)

Language server protocol is an open standard protocol for writing language server based on JSON-RPC. With this protocol, you just have to pick a library for your server to adhere to it (such as rust [lsp-server](https://crates.io/crates/lsp-server), the lsp library used by rust-analyzer) and write features with it, the client will then be quite straigtforward if your IDE support it. 

Some of them support lsp out of the box, it was developed originally for VS code, but it is now open, and others such as IntelliJ, Visual Studio, Neovim and much more added support for it (You can find a non exhaustive list [here](https://microsoft.github.io/language-server-protocol/implementors/tools/)). Writing a server following LSP means its could be used by all these IDE (still demanding to create some more or less simple client code).

What is nice about LSP is that it can be written in any language. Pick up your language, find a library following the protocol (or make your own if you have time to spare), write your server by including all the functionnality you need, and profit ! There is lot of SDK available for many languages, for which you can find a list on [Microsoft specifications](https://microsoft.github.io/language-server-protocol/implementors/sdks/).

Personnally, I choose to go with Rust as its a performant language that has a lot of tools available for language server. Plus it compile easily to WASI target, and vscode offer a really nice feature with it I will present you.

## WASI language server

Visual studio code has a web version available at [vscode.dev](https://vscode.dev). But extensions are not all compatible and you need to correctly setup your package.json so that they can run on this version. As we are on the web, we cannot execute executable for security reasons. So no language server then ? Except that now, they provide an extension that make WASI executable able to run on the web. And you can compile native code to [WASI](https://wasi.dev/) (with some limitations such as no networking, limited file system... inherent to the WASI specifications). For now, C++ and Rust are the two most compatible languages.

You can find more about it on [visual studio blog](https://code.visualstudio.com/blogs/2023/06/05/vscode-wasm-wasi). Here is also a two part implementation tutorial ([part1](https://code.visualstudio.com/blogs/2024/05/08/wasm) & [part2](https://code.visualstudio.com/blogs/2024/06/07/wasm-part2)).


# Shader language server

Now the part about shaders. There is already some good extensions on vscode for shader but with some limitations:
- [HLSL tools](https://marketplace.visualstudio.com/items?itemName=TimGJones.hlsltools): Probably the best hlsl extension, that made it to Visual Studio as default installed HLSL extension. The issue is that its not maintainted anymore and not easy to maintain as its reimplement a whole HLSL compiler to lint shaders.
- [Shader languages support for VS Code](https://marketplace.visualstudio.com/items?itemName=slevesque.shader): Nice extension for GLSL & HLSL but not maintained anymore aswell. There is no diagnostics aswell, only symbol provider. Some compatible extension are available to make add it but they rely on glslang & directx shader compiler & require them to be install as dependencies.
- [WGSL](https://marketplace.visualstudio.com/items?itemName=PolyMeilex.wgsl): Nice extension for WGSL, but only support linting, and require an external installation of the server.

These where some nice extensions, but none were really fitting my needs, so I decided to make my own language server for shader. And while we are at it, make it easy to support more than one shader language. 

And I came up with [shader validator](https://marketplace.visualstudio.com/items?itemName=antaalt.shader-validator). 

It support HLSL / GLSL & WGSL & is based on Rust. Diagnostics is run by standard API validator (Glslang, DXC, Naga) and symbol provider is provided by [tree-sitter](https://tree-sitter.github.io/tree-sitter/). Everything is bundled in the extension so it should work out of the box, and even on the web version of vscode thanks to WASI.

In a next post, I will explain more about the tech inside it !

# Interesting resources

[bytecodealliance.org - WASI 0.2](https://bytecodealliance.org/articles/WASI-0.2)

[microsoft.github.io - Language Server Protocol](https://microsoft.github.io/language-server-protocol/)

[github.com - vscode-wasm](https://github.com/microsoft/vscode-wasm)