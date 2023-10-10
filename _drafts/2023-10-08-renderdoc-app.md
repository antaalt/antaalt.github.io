---
layout: post
lang: en
title: "Renderdoc C/C++ API"
subtitle: "How to integrate Renderdoc C/C++ API within your engine."
author: "Me"
background: '/assets/images/projets/aka.jpg'
---

Renderdoc is a widely spread graphic debugging application that I happen to use a lot with my job, and I must say its quite efficient, I prefer it over NVIDIA Nsight & PIX, the two major alternatives because of its simplicity & efficiency, though its not as powerful as Nsight.

What's nice about RenderDoc is that it can be enabled within your engine. With their [In-application API](https://renderdoc.org/docs/in_application_api.html), you can integrate renderdoc in your engine to avoid the burden of connecting to it everytime you launch it. This way, you can have a simple button in you UI in order to capture a frame instantly. Unreal engine has a [plugin](https://docs.unrealengine.com/4.27/en-US/TestingAndOptimization/PerformanceAndProfiling/RenderDoc/) that is using it and I found it very convenient and decided to try implementing it within my engine, and it end up being quite easy, so go on and stop wasting so much time connecting to your API ! I did not search much about it but it seems [PIX also allow integration](https://devblogs.microsoft.com/pix/pix-2108-18/) within your engine and [Nsight aswell](https://docs.nvidia.com/nsight-graphics/NsightGraphicsSDK/index.html).

But here I will only talk about renderdoc, its probably the same logic though.

# In application API

Their API can be easily accessed from their repo [here](https://github.com/baldurk/renderdoc/tree/v1.x/renderdoc/api). You will Need two things in order to make it work:
- Include the file app/renderdoc_app.h somehow in your application.
- Install renderdoc on your machine so that renderdoc.dll (librenderdoc.so on linux) is accessible. You will also need it to launch the captures you make !

With all this setup, you will be able to capture some frame !

We need to load the DLL **before** the device creation. This is important as renderdoc need to be injected in the device.

```c
// TODO check the loading here that seems too much, should not need both call to load library & getmodulehandle.
if (HMODULE module = LoadLibrary("C:/Program Files/RenderDoc/renderdoc.dll"))
{
    if (HMODULE module = GetModuleHandle("renderdoc"))
    {

    }
}
// TODO linux android equivalent
vkDeviceCreateInstance(...);
```

After this is done, everything is setup to capture a frame ! There is various way to capture a frame with this API that I will let you explore in the documentation, the simplest way being to begin & end the capture when you need it.


```c
// To start a frame capture, call StartFrameCapture.
// You can specify NULL, NULL for the device to capture on if you have only one device and
// either no windows at all or only one window, and it will capture from that device.
// See the documentation below for a longer explanation
if(rdoc_api) rdoc_api->StartFrameCapture(NULL, NULL);

// Your rendering should happen here

// stop the capture
if(rdoc_api) rdoc_api->EndFrameCapture(NULL, NULL);
```

You can then ask the API to start Renderdoc to view your capture.

```c
// TODO capture code
```

Et voilà ! You have a succesfully captured frame ! Enjoy debugging it !

# Resources
[GPUopen](https://gpuopen.com/learn/integrating-renderdoc-for-unconventional-apps/)