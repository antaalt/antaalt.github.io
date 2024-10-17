---
layout: post
lang: en
title: "From native to WASM in Rust"
subtitle: "How to make your rust winit/wgpu app in the browser with WASM."
author: "Antoine"
image: '/assets/images/posts/wasm/wasm-logo.png'
image-alt: 'wasm logo'
---

Rust is nice, you can write plenty of safe code with it and there is starting to be some really intersting projects such as [Bevy](https://bevyengine.org/) for 3D rendering. And what's so nice about Bevy is that it's using [WGPU](https://wgpu.rs/). And WGPU support [WebAssembly](https://webassembly.org/) ! Which makes bevy able to run on the browser !

But I am not here to talk about Bevy, I am here to talk about custom engine & applications. One of the classic duo for 3D application in rust is [winit](https://github.com/rust-windowing/winit), a window handling library used with WGPU for the graphic backend. I started a small project and wanted to port it on wasm, but did not found much resources about converting an existing winit / wgpu application to wasm, so here it is !

# Quick note

At the time of this writing, WASM is still experimental and some browser [does not support it fully](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status) *yet*.

# Setting up your project

First to build a project for WASM, you will need some setup. First, you need to add some dependencies. For that, you can edit your file cargo.toml and add the following
```toml
[dependencies]
wasm-bindgen = "0.2.92"
wasm-bindgen-test = "0.3.42"
web-sys = "0.3.5"
js-sys = "0.3.68"
console_log = "1.0.0"
console_error_panic_hook = "0.1.7"
```
The target arch force these dependencies only for wasm build, which is exactly what we want. Shared dependencies need to go into standard `[dependencies]`

- **wasm-bindgen** is necessary to setup your project for wasm
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
pub async fn start() -> Result<(), JsValue> {
    use std::panic;
    // Here we ensure console_log is working
    console_log::init_with_level(log::Level::Debug).expect("could not initialize logger");
    // Here we ensure panic will send log to the web console
    panic::set_hook(Box::new(console_error_panic_hook::hook));
    // Here we run our async application
    app::run().await;
    
    Ok(())
}
```

Once you made your entry point correctly, you will be able to build your project. Note that there is many way to setup this, here we simply execute our whole app within the start that is called when loading the web assembly file in the browser, but we could retrieve an object and handle our application lifecycle from javascript instead. There are many resources on this topic on the web.

> **NOTE**: The function is async here, it is not mandatory. You cannot use library such as pollster because the browser need to use its own async executor.

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

![Missing target error](/assets/images/posts/wasm/missing-target-illustration.png)

## Missing target
By default, wasm compiler is not available in cargo, so its missing all the standard library so you have to install it yourself. That's simple, just run 

```shell
rustup target add wasm32-unknown-unknown
```

> **BONUS**: For vscode user, you can also add `"rust-analyzer.cargo.target": "wasm32-unknown-unknown"` to your [rust analyzer](https://rust-analyzer.github.io/) extension settings so that linting is working with this target.

Once you did this, run `cargo build` another time, and it should pass... except it does not.

*Wanted to add a screen of the error but somehow I cannot reproduce it 🤔*

## Unstable WGPU
As seen [here](https://github.com/gfx-rs/wgpu/wiki/Running-on-the-Web-with-WebGPU-and-WebGL), webgpu is still unstable. Which means you will have to tell your compiler to enable unstable API. You can do this by setting the RUSTFLAGS environment variable. Their is a lot of way to do this, the easier being to create or edit a file at .cargo/config.toml and adding the following content so that this variable is only set when you compile your project for web assembly.

```toml
[target.wasm32-unknown-unknown]
rustflags = ["--cfg=web_sys_unstable_apis"]
```

Finally, you can run again the project, and you should be able to compile it. Be aware that some dependencies might have difficulties with wasm compiler, and that you might run into some unexpected issues, such as dependencies that does not support wasm. Generally, the --no-default-features flag should solve a majority of them, but you might need to fix some code to compile aswell. Don't forget the `#[cfg(target_arch = "wasm32")]` which will be your best friend for that.

# Generating dependencies

## Generate javascript bindings

With the previous step, you should have a wasm file somewhere in your targets. We will use it to generate javascript bindings for the browser. You will need to install cargo-bindgen-cli to execute the following commands. Run `cargo install cargo-bindgen-cli`.

Then you can run :

```shell
wasm-bindgen path/to/wasm.wasm --out-dir out/dir/path --out-name app_name --target no-modules
``` 

This will generate javascript bindings for your wasm file. Arguments are as follow
- Path to your input wasm
- Path where you want to save output javascript files
- Yout application name for javascript files generated
- **--target no-modules** the target for your javascript. Here I want to load it directly from javascript in an HTML file so I go with no-modules. More info [here](https://rustwasm.github.io/wasm-bindgen/reference/deployment.html).

## Optimize WASM file

An optional step, we can optimize the WASM file with wasm-opt to reduce its size. First, we need to install wasm-opt:

```shell
cargo install wasm-opt
``` 

Then we can run the following command to optimize it.

```shell
wasm-opt path/to/wasm.wasm -O2 --fast-math -o path/to/wasm.wasm
``` 

## Testing

Small note on testing, unit testing in rust is really easy. You will need `wasm-bindgen-test` for that in WASM :

```rust
use wasm_bindgen_test::*;

#[wasm_bindgen_test]
fn pass() {
    assert_eq!(1, 1);
}

#[wasm_bindgen_test]
fn fail() {
    assert_eq!(1, 2);
}
```

You will need to add `wasm-bindgen-test-runner` to your dependency so that wasm test run in a browser.

```toml
[target.wasm32-unknown-unknown]
runner = 'wasm-bindgen-test-runner'
```

## Deploying

Now we have everything we need !
Create an index.html file, include your javascript and then you can run your javascript :

```js
wasm_bindgen("path/to/wasm.wasm")
                .then(on_wasm_loaded)
                .catch(on_error);
```

Winit should handle everything and insert a canvas in your HTML for the app if you created your window correctly:

```rs
#[cfg(target_arch = "wasm32")]
let builder = {
    use winit::platform::web::WindowBuilderExtWebSys;
    builder.with_append(true)
};
let window = builder
    .build(&event_loop)
    .unwrap();
```

# Final note

With all this done, you should be able to run your wasm application in a web page. You can now even create a github action that will automatically deploy your app on the web ! Don't hesitate to check this [repo](https://github.com/antaalt/protos-rs), a personal project of a rust app I ported on WASM !
