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

# Setting up your project

First to build to project for WASM, you will need some setup. You will need to add some dependencies. For that, you can edit your file cargo.toml and add the following
```toml
[target.'cfg(target_arch = "wasm32")'.dependencies]
wasm-bindgen = "0.2.92"
wasm-bindgen-futures = "0.4.42"
wasm-bindgen-test = "0.3.42"
web-sys = "0.3.5"
js-sys = "0.3.68"
console_log = "1.0.0"
console_error_panic_hook = "0.1.7"
```
The target arch force these dependencies only for wasm build, which is exactly what we want. Shared dependencies need to go into standard [dependencies]

- **wasm-bindgen** is necessary to setup your project for wasm
- **wasm-bindgen-futures** let you wait for async function, because libraries such as pollster are not supported in WASM, you need the browser async executor.
- **wasm-bindgen-test** will let you run specific tests for your wasm API.
- **web-sys** is a procedurally generated crate providing a binding to all APIs that browsers provide on the web.
- **js-sys** will pass you bindings for all global JS objects
- **console_log** is recommended if you want to log from your app
- **console_error_panic_hook** is highly recommended, it will improve your panic log on the browser.

Don't forget to also declare your crate as a lib, which is mandatory for wasm.

```toml
[lib]
crate-type = ["cdylib"]
```

After adding all this, you will be able to setup your entry point. Create a lib.rs at the root if it does not exist and you can setup your entry point this way

```rust
// ----------------------------------------------------------------------------
// When compiling for web:
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::{self, prelude::*};

/// This is the entry-point for all the web-assembly.
/// This is called once from the HTML.
/// It loads the app, installs some callbacks, then returns.
/// You can add more callbacks like this if you want to call in to your code.
#[cfg(target_arch = "wasm32")]
#[wasm_bindgen(start)]
pub fn start() {
    use std::panic;
    // Here we ensure console_log is working
    console_log::init_with_level(log::Level::Debug).expect("could not initialize logger");
    // Here we ensure panic will send log to the web console
    panic::set_hook(Box::new(console_error_panic_hook::hook));
    // Here we run a rust feature on the current thread. WGPU has some async creation function, 
    // so you will have to make function async as you can't block
    wasm_bindgen_futures::spawn_local(async move {
        run_your_app_async().await;
    });
}
```

Once you made your entry point correctly, you will be able to build your project. Note that there is many way to setup this, here we simply execute our whole app within the start that is called when loading the web assembly file in the browser, but we could retrieve an object and handle our application lifecycle from javascript instead. There are many resources on this topic on the web, feel free to look for this.

# Building the project

Once you setup everything, building the project is fairly simple, simply run

```shell
cargo build --lib --target wasm32-unknown-unknown --no-default-features
```

Here we have a lot of things happening
- **cargo build** build your solution.
- **--lib** tell your compiler to compile only a library, which is the only way to generate WASM, so we need to pass here for building our app for WASM.
- **wasm32-unknown-unknown** is the target required for web assembly. You will find two target for wasm: wasm32-unknown-unknown & wasm32-unknown-emscripten but emscripten seems to exist for [legacy reason](https://users.rust-lang.org/t/wasm-unknown-vs-emscripten/22997) so we will just ignore it.
- **--no-default-features** is not mandatory but you will probably need it to fix your compilation. It prevents your dependencies to activate default features which might not be wasm friendly

But wait, I still have an issue !

TODO: schema of issue with missing target

## Missing target
By default, wasm compiler is not available in cargo, so you have to install it yourself. That's simple, just run 

```shell
rustup target add wasm32-unknown-unknown
```

Bonus: For vscode user, you can also add "rust-analyzer.cargo.target": "wasm32-unknown-unknown" to your [rust analyzer](https://rust-analyzer.github.io/) extension settings

Once you did this, run `cargo build` another time, and it should pass... except it does not

TODO: schema of no rust flags.

## Unstable WGPU
As seen [here](https://github.com/gfx-rs/wgpu/wiki/Running-on-the-Web-with-WebGPU-and-WebGL), webgpu is unstable and unstable API don't follow [web_sys](https://rustwasm.github.io/wasm-bindgen/api/web_sys/) semantic version. Which means you will have to tell your compiler to enable unstable API. You can do this by setting the RUSTFLAGS environment variable. Their is a lot of way to do this, the easier being to create or edit a file at .cargo/config.toml and adding the following content so that this variable is only set when you compile your project for web assembly.

```toml
[target.wasm32-unknown-unknown]
rustflags = ["--cfg=web_sys_unstable_apis"]
```

Finally, you can run again the project, and you should be able to compile it. Be aware that some dependencies might have difficulties with wasm compiler, and that you might run into some unexpected issues. Generally, the --no-default-features flag should solve them, but you might need to fix some code to compile aswell. Don't forget the `#[cfg(target_arch = "wasm32")]` which will be your best friend to solve them.

It seems somes issues might still exist between [Winit & WGPU](https://www.reddit.com/r/rust/comments/1856u5a/what_is_the_state_of_winit_x_wgpu/) but i personnaly did not had them

# Generating dependencies

With the previous step, you should have a wasm file somewhere in your targets. We will use it to generate javascript bindings for the browser. You will need to install cargo-bindgen-cli to execute the following commands. Run `cargo install cargo-bindgen-cli`.

Then you can run :

```shell
wasm-bindgen path/to/wasm.wasm --out-dir out/dir/path --out-name app_name --no-modules --no-typescript
``` 

This will generate javascript bindings for your wasm file. arguments are as follow
- path to your wasm
- path where to save js files
- app_name
- **--no-modules** to not generate javascript modules ECMA TODO:
- **--no-typescript** TODO:

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



# Resources
https://github.com/gfx-rs/wgpu/wiki/Running-on-the-Web-with-WebGPU-and-WebGL