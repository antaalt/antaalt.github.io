---
layout: post
lang: en
title: "shader-validator and the future of the shader ecosystem"
subtitle: "Where shader tooling stands, where it is heading, and what is next for shader-validator"
author: antaalt
image: '/assets/images/posts/shader-validator-part2/logo-shader-validator.png'
image-alt: 'shader validator logo'

---

Until 2024, glslang, one of the most widely used shader compilers, could not tell you which *column* an error was on. The information was there internally, it simply was not printed in the logs. Without it, a linter cannot highlight the faulty word, only the whole line. I [fixed it](https://github.com/KhronosGroup/glslang/issues/3238) with a change of about ten characters.

To me, this anecdote sums up shader tooling today: GPUs and shader languages move fast, while the tools we use to write shaders lag behind. In this post, I look at why, how the ecosystem is changing, where shader-validator stands in all of this, and where I would like to take it next.

## Shader tooling is lagging behind

Compared to C++ or Rust, writing shaders is still a basic experience. Syntax highlighting is often all you get, and some of the best tools, such as the excellent HLSL Tools, are no longer maintained.

The biggest problem, though, is entry points. A C++ or Rust codebase usually has a handful of `main` functions. A shader codebase can have tens of thousands of them once you count every file and every *permutation*: the same shader compiled several times with different macros, each producing a different program. To validate a shader, a tool needs to know which entry point and which macros to use, and I have yet to find an editor that offers a decent way to choose them. This is what shader-validator solves with its *variants*: you select the entry point and defines you care about, and your code is validated the way it will actually be compiled.

## The shader ecosystem is converging

Shader languages have always been a few steps behind general-purpose languages. But GPUs are becoming central to computing, and things are changing fast.

### HLSL moves to Clang and SPIR-V

HLSL is being [standardized](https://devblogs.microsoft.com/directx/standardizing-hlsl/) with a proper versioning process, and [support is being added to Clang](https://clang.llvm.org/docs/HLSL/HLSLSupport.html). HLSL will get the whole LLVM ecosystem behind it, and new features such as templates and operator overloading can build on Clang's solid C++ foundation. Over time, Clang will replace the DirectX Shader Compiler (DXC).

And that's not all: with Shader Model 7, DirectX will [adopt SPIR-V](https://devblogs.microsoft.com/directx/directx-adopting-spir-v/) and drop its proprietary DXIL intermediate format. This is great news for open source and collaboration. Together with GLSL and WGSL, SPIR-V is becoming the de facto intermediate format for shaders.

### Slang joins Khronos

Slang, originally an NVIDIA project, is now [hosted by the Khronos Group](https://www.khronos.org/news/press/khronos-group-launches-slang-initiative-hosting-open-source-compiler-contributed-by-nvidia). It builds on HLSL with features such as modules (`import`) and automatic differentiation, and ships with the Vulkan SDK. Glslang is now frozen in favor of Slang, which might become the new standard alongside HLSL.

### WGSL and WESL bring shaders to the web

WGSL arrived with WebGPU and gives the web a human-readable shader language, now supported by all major browsers. [WESL](https://wesl-lang.dev/) extends it with imports and conditional compilation. Together, they give real-time rendering on the web a solid foundation.

### Hardware keeps moving

Language changes are mostly driven by hardware. First came vertex and pixel shaders, then compute shaders, then ray tracing shaders, and tools barely keep up.

The most recent example I can think of is work graphs: the GPU can now schedule its own work without the CPU having to step in. It's a big step forward, but it can lead to situations that are terrible to debug...

<blockquote class="twitter-tweet" data-theme="dark"><p lang="zxx" dir="ltr"><a href="https://t.co/1uZAXQS2yh">https://t.co/1uZAXQS2yh</a> <a href="https://t.co/YBNjNLFbNs">pic.twitter.com/YBNjNLFbNs</a></p>&mdash; Jeremy Laumon (@_plop_) <a href="https://x.com/_plop_/status/1672137808884973568?ref_src=twsrc%5Etfw">June 23, 2023</a></blockquote> <script async src="https://platform.x.com/widgets.js" charset="utf-8"></script>

And there is more: shader execution reordering, which lets the GPU regroup ray tracing threads to reduce divergence, and neural shading, with cooperative vectors in Vulkan and DirectX and tensors in Metal 4. Shaders can now run machine learning inference, using types and intrinsics that most IDEs don't know about. Shader-validator doesn't support them yet either, for reasons I explain below.

## shader-validator today

So where does shader-validator stand? I covered how it works in more depth in [part 2](TODO-link-to-part-2).

TODO: short list of the current features.

Overall, the main limitation is that the Rust shader ecosystem is not mature yet. Most shader compilers are C++ libraries, and despite huge efforts from some people, their Rust bindings are often barely maintained:

- **DXC**: bindings come from [hassle-rs](https://github.com/Traverse-Research/hassle-rs). They are heavy, limited to Shader Model 6.8, and updates are becoming sparse. It seems the 
- **Slang**: the existing Rust bindings don't expose enough of the API to be usable yet (more on that below).
- **glslang**: the exception. Thanks to [glslang-rs](https://github.com/SnowflakePowered/glslang-rs) and its active maintainer @chyyran, support is very complete.

## Where shader-validator is going

### Why not use an existing language server?

It would be great to build on `clangd`, `slangd`, `glsl_analyzer` or `wgsl_analyzer`. They look quite complete, and being specialized, they probably do more than shader-validator in some areas. But none of the ones I tested let you work with your shaders *as a codebase*: selecting entry points and controlling how each one is validated, as shader-validator does. Module systems are making shaders more flexible and might work around the entry point issue, but many shaders are still driven by defines, where a single `main` function behaves completely differently depending on the macros passed to it.

That is why I believe shader-validator is worth pursuing. And because it does not reimplement a parser or a compiler, updates are easy to integrate, which makes it easy to experiment with new features such as a dependency viewer.

Most of these features would take a lot of work to integrate into a generic language server. Perhaps the concept could be added to the LSP specification? For now, shader-validator relies on custom commands outside the spec.

### A shader AST based on SPIR-V?

For a while, I considered using SPIR-V directly as the intermediate structure for parsing symbols. It is the future of DXC and already the present of GLSL and WGSL. But it has too many issues:

- **No preprocessor awareness**: we cannot know which regions are active or inactive.
- **Dead code elimination**: unused code disappears. `NonSemantic.Shader.DebugInfo` can mitigate this, but it might still be tricky.
- **Compilation must succeed**: no symbols at all as soon as the code is broken, which is exactly when you need help.
- **An entry point is required**: header files cannot be validated.

Instead, a generic shader AST format holding debug information and source maps could be a good solution. It would need to handle preprocessing, though, which is one of the major drawbacks of [tree-sitter](https://tree-sitter.github.io/tree-sitter/), currently used by shader-validator, and of potential alternatives such as [rowan](https://github.com/rust-analyzer/rowan).

### Features on the roadmap

Here is where I would like to focus next:

- **Better HLSL support**: it is good but far from perfect. Templates are missing, and DXC needs updating to support the latest shader models. Ideally, HLSL would also work on the web, but that requires compiling DXC to WASI, which is not possible today because it is a dynamic library.
- **GLSL extensions**: GLSL support is fairly complete, except for extensions. Only one is supported for now: `GL_EXT_mesh_shader`.
- **An in-editor renderer**: a small renderer that runs your shaders with dummy data, so you can test quick fixes right away. Heavy to build, but I believe it would be reliable.
- **A shader debugger**: since everything goes through SPIR-V, a debugger following the [Debug Adapter Protocol](https://microsoft.github.io/debug-adapter-protocol/specification.html) could let you step through shaders, using the same dummy data as the renderer.
- **Project-wide settings and modules**: the WESL module system is not handled well by the extension yet. TODO: finish this point.
- **Path completion** for includes and imports.
- And much more...

### More languages

With tree-sitter and compiler bindings available in Rust, adding a language is fairly easy. If the extension keeps growing, it will probably need to be split per language to stay lightweight. Here are the candidates:

- **Slang** is first on the list, and I would love to support it. tree-sitter already handles it, so only validation is missing, blocked by the limited Rust bindings.
- **Metal** would be nice too, but I haven't found a tree-sitter grammar for it, and without a Mac I can't work on it.
- **ShaderLab** could be on the list as well, though I haven't looked into it much yet.
- **PSSL**, **Cg**, there are many other shader languages, but I can't support them all.

## How you can help

My goal is an all-in-one shader authoring experience: write, validate, preview, and step through your shaders. There is still a lot to do, and here is how you can help.

### Contribute

You can contribute to shader-validator directly, or to the libraries it depends on:

- **Metal**: I need Mac users, as I don't have one.
- **Slang**: Rust bindings are not ready yet. I have a PR using [slang-rs](https://github.com/FloatyMonkey/slang-rs), but it doesn't expose many Slang features yet, such as includes, so it is not usable for now. A fork might be necessary.
- **DXC**: [hassle-rs](https://github.com/Traverse-Research/hassle-rs) is stuck at Shader Model 6.8, so a fork might be necessary here as well.
- **tree-sitter grammars**: the parsers shader-validator relies on are not perfect, and improving them directly improves symbol parsing.

### Join the community

- Join the [Discord](https://discord.gg/ZMuYD9wnBW)
- Support me on [Ko-fi](https://ko-fi.com/antaalt)
