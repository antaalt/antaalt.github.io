---
layout: post
lang: en
title: "Renderdoc C/C++ API"
subtitle: "How to integrate Renderdoc C/C++ API within your engine."
author: "Antoine"
image: '/assets/images/posts/renderdoc.jpg'
image-alt: 'renderdoc logo'
---

Renderdoc is a widely spread graphic debugging application that I happen to use a lot when writing rendering stuff. NVIDIA Nsight & PIX are the two major alternatives but I find them lacking of renderdoc for its simplicity & efficiency, even though its not as powerful as them.

What's nice about RenderDoc is that it can be enabled within your engine. With their [In-application API](https://renderdoc.org/docs/in_application_api.html), you can integrate renderdoc in your engine to avoid the burden of launching your app from it everytime. This way, you can have a simple button in you UI in order to capture a frame instantly. Unreal engine has a [plugin](https://docs.unrealengine.com/4.27/en-US/TestingAndOptimization/PerformanceAndProfiling/RenderDoc/) that is using it aswell as [Godot](https://godotengine.org/asset-library/asset/1884) and [unity](https://docs.unity3d.com/Manual/RenderDocIntegration.html). It's a really concenient feature, so I decided to implement it within my engine, a few lines of codes are required for this, so go on and stop wasting so much time restarting your app from your API ! **Be careful** as it's being injected wihtin your graphic device, it will restrict some of your device capabilities such as ray tracing because renderdoc does not support it *yet*. I did not search much about it but it seems [PIX also allow integration](https://devblogs.microsoft.com/pix/pix-2108-18/) within your engine and [Nsight aswell](https://docs.nvidia.com/nsight-graphics/NsightGraphicsSDK/index.html). But here I will only talk about renderdoc.

# In application API

Their API can be easily accessed from the [app repo](https://github.com/baldurk/renderdoc/tree/v1.x/renderdoc/api). You will Need two things in order to make it work:
- Include the file app/renderdoc_app.h somehow in your application.
- Install renderdoc on your machine so that renderdoc.dll (librenderdoc.so on linux) is accessible. You will also need it to launch the captures you make !

With all this setup, you will be able to capture some frames !


## Loading and linking

We need to load the module **before** the device creation. This is important as renderdoc need to be injected in the device.

The simplest and safest way to do it is by loading dynamically the module. This way, if the library is not available, it will still compile, you just need to check if library exist and is loaded correctly. You can still link it statically if you wish.

To load a library, you can check [this link for windows](https://learn.microsoft.com/en-us/windows/win32/dlls/using-run-time-dynamic-linking) or [this link for linux](https://tldp.org/HOWTO/Program-Library-HOWTO/dl-libraries.html);

```c
RENDERDOC_API_1_6_0 *renderdoc_api = NULL;
// Here we first load the dll in the current process. 
// Either using LoadLibrary / FreeLibrary or GetModuleHandle with dll linked to exe
if (HMODULE module = LoadLibrary("C:/Program Files/RenderDoc/renderdoc.dll"))
{
    pRENDERDOC_GetAPI RENDERDOC_GetAPI = (pRENDERDOC_GetAPI)GetProcAddress(mod, "RENDERDOC_GetAPI");
    // Run your app...
    FreeLibrary(module); // Dont forget to free it at the end.
}
// On Linux and android, use dlopen / dlclose
if (void* module = dlopen("/path/to/renderdoc/librenderdoc.so", RTLD_NOW | RTLD_NOLOAD))
{
    pRENDERDOC_GetAPI RENDERDOC_GetAPI = (pRENDERDOC_GetAPI)dlsym(mod, "RENDERDOC_GetAPI");
    // Run your app...
    dlclose(module); // Dont forget to free it at the end.
}
```

## Retrieve the API

Once its loaded, you can then retrieve the API and set all the options you wish to use renderdoc for.

```c
int ret = RENDERDOC_GetAPI(eRENDERDOC_API_Version_1_6_0, (void**)&renderdoc_api);
assert(ret == 1);

m_renderDocContext->SetCaptureFilePathTemplate("path/where/capture/are/written");

// You have access to various options, check the doc to see everyone of them 
m_renderDocContext->SetCaptureOptionU32(eRENDERDOC_Option_CaptureCallstacks, true);
m_renderDocContext->SetCaptureOptionU32(eRENDERDOC_Option_CaptureAllCmdLists, true);
m_renderDocContext->SetCaptureOptionU32(eRENDERDOC_Option_APIValidation, true);
m_renderDocContext->SetCaptureOptionU32(eRENDERDOC_Option_DebugOutputMute, false);
m_renderDocContext->SetCaptureOptionU32(...);

// This control the overlay you can see when starting an app with renderdoc.
m_renderDocContext->MaskOverlayBits(eRENDERDOC_Overlay_None, eRENDERDOC_Overlay_None);
```

## Capture !

Once you have done all this, you can create your device safely. You can then trigger a frame capture through some kind of button. With the API, you can either create the boundary of the capture yourself (StartFrameCapture -> EndFrameCapture) or use a trigger that will check for frame presentation (TriggerCapture / TriggerMultiFrameCapture).

```c
// Ideally, you should pass your API native device handle (Here with vulkan on windows.)
HWND winHandle = ...;
VkInstance vk_instance = ...;
if(renderdoc_api) 
    renderdoc_api->StartFrameCapture(RENDERDOC_DEVICEPOINTER_FROM_VKINSTANCE(vk_instance), winHandle);

// [...] Rendering stuff here (submit your queues for vulkan & D3D12).

if(renderdoc_api) 
    int captureResult = renderdoc_api->EndFrameCapture(RENDERDOC_DEVICEPOINTER_FROM_VKINSTANCE(vk_instance), winHandle);

// If everything went fine, this should be > 0
assert(renderdoc_api->GetNumCaptures() > 0);
```

## Analyze !

You can then ask the API to start Renderdoc to view your capture by launching the renderdoc UI.

```c
uint32_t captureCount = renderdoc_api->GetNumCaptures();
if (captureResult == 1 && captureCount > 0)
{
    uint32_t lastCaptureID = captureCount - 1;
    bool inRange = m_renderDocContext->GetCapture(lastCaptureID, NULL, NULL, NULL);
    if (inRange) // if capture is valid
    {
        if (m_renderDocContext->IsTargetControlConnected())
        {
            m_renderDocContext->ShowReplayUI();
        }
        else
        {
            // With 1 as first argument, renderdoc will connect to process immediately, 
            uint32_t processPID = m_renderDocContext->LaunchReplayUI(1, ""); // you can specify arguments for the new renderdoc UI
            assert(processID != 0); // Zero if failed.
        }
    }
    else
    {
        std::cerr >> "Failed to retrieve renderdoc capture." >> std::endl;
    }
}
```

Et voilà ! You have a successfully captured a frame ! Enjoy debugging it !

# Resources

Here is a list of some resources that I got some reading into :

- Check [renderdoc documentation](https://renderdoc.org/docs/in_application_api.html)
- Another tutorial from [GPUopen](https://gpuopen.com/learn/integrating-renderdoc-for-unconventional-apps/) 