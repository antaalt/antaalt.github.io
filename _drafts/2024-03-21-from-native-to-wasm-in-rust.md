---
layout: post
lang: en
title: "From native to WASM in Rust"
subtitle: "How to make your rust winit/wgpu app in the browser with WASM."
author: "Antoine"
background: '/assets/images/posts/wasm.png'
---

Rust is nice, you can write plenty of safe code with it and there is starting to be some really intersting projects such as [Bevy](https://bevyengine.org/) for 3D rendering. And what's so nice about Bevy is that it's using [WGPU](https://wgpu.rs/) ! And WGPU support [WebAssembly](https://webassembly.org/) ! Which makes bevy able to run on the browser !

But I am not here to talk about Bevy, I am here to talk about custom engine & applications. One of the classic duo for 3D application in rust is [winit](https://github.com/rust-windowing/winit), a window handling library used with WGPU for the graphic backend. I started a small project and wanted to port it on wasm, but did not found much resources about converting an existing winit / wgpu application to wasm, with in bonus, a github action workflow for github pages, so here it is !

# WGPU
https://github.com/gfx-rs/wgpu/wiki/Running-on-the-Web-with-WebGPU-and-WebGL


# Setting up your project

toml

lib.rs

# Building the project

Building the project is fairly simple, simply run

`cargo build --lib --target wasm32-unknown-unknown --no-default-features`

Here we have a lot of things happening
- **cargo build** build your solution.
- **--lib** tell your compiler to compile only a library, which is the only way to generate WASM, so we need to pass here for building our app for WASM.
- **wasm32-unknown-unknown** is the target required for web assembly. You will find two target for wasm: wasm32-unknown-unknown & wasm32-unknown-emscripten but emscripten seems to exist for [legacy reason](https://users.rust-lang.org/t/wasm-unknown-vs-emscripten/22997) so we will just ignore it.
- **--no-default-features** is not mandatory but you will probably need it to fix your compilation. It prevents your dependencies to activate default features which might not be wasm friendly

But wait, I still have an issue !

TODO: schema of issue with missing target

## Missing target
By default, wasm compiler is not available in cargo, so you have to install it yourself. That's simple, just run 

`rustup target add wasm32-unknown-unknown`


Bonus: For vscode user, you can also add "rust-analyzer.cargo.target": "wasm32-unknown-unknown" to your [rust analyzer](https://rust-analyzer.github.io/) extension settings

Once you did this, run `cargo build` another time, and it should pass... except it does not

TODO: schema of no rust flags.

## Unstable WGPU
As seen (here)[https://github.com/gfx-rs/wgpu/wiki/Running-on-the-Web-with-WebGPU-and-WebGL], webgpu is unstable and unstable API don't follow (web_sys)[https://rustwasm.github.io/wasm-bindgen/api/web_sys/] semantic version. Which means you will have to tell your compiler to enable unstable API. You can do this by setting the RUSTFLAGS environment variable. Their is a lot of way to do this, the easier being to create or edit a file at .cargo/config.toml and adding the following content so that this variable is only set when you compile your project for web assembly.

```toml
[target.wasm32-unknown-unknown]
rustflags = ["--cfg=web_sys_unstable_apis"]
```

Finally, you can run again the project, and you should be able to compile it. Be aware that some dependencies might have difficulties with wasm compiler, and that you might run into some unexpected issues. Generally, the --no-default-features flag should solve them, but you might need to fix some code to compile aswell. Don't forget the `#[cfg(target_arch = "wasm32")]` which will be your best friend to solve them.

It seems somes issues might still exist between (Winit & WGPU)[https://www.reddit.com/r/rust/comments/1856u5a/what_is_the_state_of_winit_x_wgpu/] but i personnaly did not had them

# Generating dependencies

With the previous step, you should have a wasm file somewhere in your targets. We will use it to generate javascript bindings for the browser. You will need to install cargo-bindgen-cli to execute the following commands. Run `cargo install cargo-bindgen-cli`.

Then you can run 
`wasm-bindgen target/wasm32-unknown-unknown/debug/protos_rs.wasm --out-dir web/public/scripts --out-name protos_rs --no-modules --no-typescript` 
The arguments
- bla

TODO: check --web argument here (https://github.com/gfx-rs/wgpu/wiki/Running-on-the-Web-with-WebGPU-and-WebGL)

After this, we can optimize the WASM file with the following command:
wasm-opt target/wasm32-unknown-unknown/debug/protos_rs.wasm -O2 --fast-math -o target/wasm32-unknown-unknown/debug/protos_rs.wasm
TODO: test this, need binaryen which is c++

## wasm-pack
OR simply use wasm-pack
https://surma.dev/things/rust-to-webassembly/
https://github.com/rust-windowing/winit/blob/master/examples/web.rs
install npm latest
cargo install wasm-pack

wasm-pack build -d web/public
somehow, i have issue with it, need to inspect...
TODO: test this

## ISSUE WITH POLLSTER
issues with pollster, async not supported
condvar wait not supported
https://www.reddit.com/r/rust/comments/srtrbz/wasm_panicked_at_condvar_wait_not_supported/

# NODE NPM MODULE
NOW, if you want to make node module, check this, here we make a full app desktop (really interesting intro to WASM for rust aswell IMO)
https://developer.mozilla.org/en-US/docs/WebAssembly/Rust_to_Wasm
This one aswell
https://wasmbyexample.dev/examples/hello-world/hello-world.rust.en-us.html
nice resources for this here aswell
https://rustwasm.github.io/book/game-of-life/hello-world.html
https://rustwasm.github.io/docs/wasm-pack/tutorials/npm-browser-packages/template-deep-dive/cargo-toml.html

// This is for using yew for ease of use 
Yew is like react in rust, not what i needed
https://plippe.github.io/blog/2021/07/12/rust-wasm-github.html

## support for WGPU on browser
you need to enable experimental flags on your browser to use WebGPU 
https://github.com/gpuweb/gpuweb/wiki/Implementation-Status


# DEPLOY
github pages actions & co for self deployment
check commits
https://github.com/emilk/egui/blob/master/.github/workflows/deploy_web_demo.yml
