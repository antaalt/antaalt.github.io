---
layout: post
lang: en
title: "Compile C++ to WASI"
subtitle: "Compile a C++ project to target wasi and run on browser"
author: Antoine
image: '/assets/images/posts/wasi.png'
image-alt: 'wasi logo by lachlansneff'

---

Web assembly has gotten more and more popular, with more browser supporting it. But it has some serious limitations, that are mostly due to the execution target which is the browser. For security reasons, web assembly cannot execute system calls such as reading / writing files, creating threads...

In order to solve this, [WASI](https://wasi.dev/) (standing for Web assembly system interface) was created. It was designed as an extension of web assembly with the same goal in mind but supporting some system functionnality. As of today, WASI support reading / writing files, creating threads through extension, sockets through another extensions... It is still in its early development and you will only find preview available for now.

But you can already see some implementation of it in interseting ways. Thanks to WASI, VScode support native extension (Rust & C++) on [vscode.dev](https://vscode.dev/) ! You can find more about this [here](https://code.visualstudio.com/blogs/2023/06/05/vscode-wasm-wasi).

# Build c++ API into rust

The most common way to make a C++ library accessible to rust is by creatings bindings for foreign C++ code, which we call FFI (Foreign function interface). You can find more about it on the [rustonomicon](https://doc.rust-lang.org/nomicon/ffi.html).

To build an application using FFI, it is common to have the following code architecture (following some [conventions](https://doc.rust-lang.org/cargo/reference/build-scripts.html#the-links-manifest-key)):
- a crate `my-app-sys` holding a generated interface to your code, that is built using a build.rs and linked to the crate.
- a crate `my-app` using my-app-sys and eventually proposing an improved interface with a more rust-like interface, hiding the unsafe call being a nice interface.

# Build c++ API into rust WASI

## Building C++ to WASI

In order to build C++ to WASI, you need to use the [WASI SDK](https://github.com/WebAssembly/wasi-sdk) that you can download in the [release](https://github.com/WebAssembly/wasi-sdk/releases) section of their Github repo. This SDK contains some required component such as a sysroot containing libc, libc++ & some important library already compiled for WASI to be linked against on build.

To build a program, you will need to use clang++ as its the only supported compiler for now. Either use any clang version to which you provide a path to WASI SDK sysroot, or use the bundled clang version in WASI SDK that already link the sysroot internally to build your application.

You will need to set some important flags such as: 

- `-fno-exceptions` as WASI does not support exceptions yet. 
- `-L/path/to/sysroot/{wasi-target}/lib/wasm32-wasi` to tell the compiler where to find c++ lib to link against
- `-lstatic=c++ -lstatic=c++ab` to tell the compiler which C++ lib we link against.
- `--sysroot="path/to/sysroot` to tell the compiler where to find all configurations for target.

You should be able to build your project and generate a .wasm file.

## Building rust to WASI

Building WASI is quite straight forward in rust. First simply add one of the target you need. WASI has multiple target as its still in its early prototyping. You will have access to 2 previews version as of now aswell as some extension that support interesting features such as threads. Theses extensions are not yet part of core, but they are already quite used:

- **wasm32-wasip1**: Preview 1
- **wasm32-wasip2**: Preview 2
- **wasm32-wasip1-threads**: Preview 1 with threads support

You can then simply add the target. If you don't add it, you will not be able to compile if you use anything from standard library.

```sh
rustup target add wasm32-wasip1
```

You should have a codebase following this structure:

```shell
my-app
├─ README.md
├─ Cargo.toml
├─ my-app-sys
│  ├─ Cargo.toml
│  ├─ build.rs # The build script
│  ├─ src
│  │  └─ lib.rs # Here are the rust bindings to the C++ library. 
│  └─ native # Your library C++ code is here
│     ├─ header.h
│     ├─ impl.cpp
│     │   ...
└─ my-app
   ├─ Cargo.toml
   └─ src
      └─ main.rs
```

> **NOTE**: You can look at [bindgen](https://github.com/rust-lang/rust-bindgen) to automate the binding generation.

You will also need the WASI_SYSROOT environment variable set for cc-rs targetting the sysroot from WASI_SDK.

Then simply run:

```sh
cargo build --target wasm32-wasip1
```
Which will generate a wasm executable. To test it directly, you can download wasmtime and run `wasmtime /path/to/my/wasm`.


## Linking C++ to rust for WASI

Now the most intersting, we know how to compile rust to WASI & C++ to WASI, aswell as how to bind C++ API to rust but using C++ binding to rust in WASI can be simplified.

For ease, you can use [cc-rs](https://github.com/rust-lang/cc-rs) which support compilation to WASI out of the box.

You can then simply build the library with the following build.rs:

```rust
fn main() {
    // Use the `cc` crate to build a C file and statically link it.
    // It now support WASI c++ out of the box (since version 1.0.104)
    // It relies on WASI SDK & clang which is the only supported compiler as of today.
    let mut builder = cc::Build::new();
    builder
        .std("c++17")
        .cpp(true)
        .include("native")
        .flag("-v")
        .file("./native/cool.cpp");

    builder.compile("cool");
}
```

Your application should now be running C++ code within a WASI executable in rust. This is a really cool features as this let us run some big project on the web ! For example, you can build [glslang](https://github.com/KhronosGroup/glslang) to WASI using this ! A full features version of glslang running in a browser supporting WASI, now imagine the possibilites...

You can find a complete codebase on my [git repo](https://github.com/antaalt/wasi-rust-with-cpp-bindings) for compiling C++ to WASI with rust.

# Interesting resources

- [infoq.com - WebAssembly](https://www.infoq.com/presentations/webassembly-intro/)
- [jesuisundev.com - Understanding web assembly in 5 minutes](https://www.jesuisundev.com/en/understand-webassembly-in-5-minutes/)
- [neugierig.org - WebAssembly and C++](https://neugierig.org/software/blog/2022/06/wasm-c++.html)