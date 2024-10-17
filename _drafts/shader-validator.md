---
layout: post
lang: en
title: "Shader language server"
subtitle: "Creating a language server for shader"
author: Antoine
image: '/assets/images/posts/logo-shader-validator.png'
image-alt: 'shader validator logo'

---

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

https://marketplace.visualstudio.com/items?itemName=antaalt.shader-validator
https://open-vsx.org/extension/antaalt/shader-validator

Extension VScode

https://code.visualstudio.com/blogs/2023/06/05/vscode-wasm-wasi
https://code.visualstudio.com/blogs/2024/05/08/wasm
https://code.visualstudio.com/blogs/2024/06/07/wasm-part2

https://github.com/microsoft/vscode-wasm

# How to write a language server - part 1

## What is a language server

A language server is a server (duh) that will be responsible of helping programmer by providing him some helpful features. This kind of feature could be:

- Diagnostic: Send some feedback about the code you are writing telling you where you made some mistake such as forgetting ';'.
- Hover: Provide some informations when you hover your cursor at some point in your code
- Completion: provide you some code as you type
- Goto: when clicking on a symbol, find its definition & get to it.
- A lot more...

These features are not automatic, and you need code to analyze what you are writting and interpret it as you type. Thats what a language server does. You can find some famous language server such as [rust analyzer](https://rust-analyzer.github.io/) for Rust or [shader-language-server](https://github.com/antaalt/shader-language-server) for shaders.

As its server, we will need a client, which will be mostly of the time your favorite IDE.

But instead of writing your own client / server protocol, why not use something that already exist and is supported by some IDE already ? This is [language server protocol](https://microsoft.github.io/language-server-protocol/), or lsp as its called. 

## Language server protocol (LSP)

Language server protocol, as its name explain it, is an open standard protocol for writing language server. With this protocol, you just have to pick a lib for your server following it (such as [lsp-server](https://crates.io/crates/lsp-server), the lsp library used by rust-analyzer) and write features with it, and the client will be quite straigtforward if your IDE support it. 

Some IDE support lsp, it was developed originally for VS code, but it is now open, and others such as IntelliJ and Visual Studio added support for it. So writing a server following LSP means its could be used by all these IDE (still demanding to create some more or less simple client code).



## WASI

lsp on wasi



# How to write a language server - part 2

## Syntax highlighting

tmlanguage, improvement

## Diagnostics

Dxc, glslang, Naga, rust

## Symbol regex


## Symbols through tree sitter
(Could have its own blog post.)

Neovim

https://tree-sitter.github.io/tree-sitter/

Linting

Dedicated post on WASI

# Interesting resources

[bytecodealliance.org - WASI 0.2](https://bytecodealliance.org/articles/WASI-0.2)