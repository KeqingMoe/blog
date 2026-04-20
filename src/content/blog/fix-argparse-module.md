---
title: 记一次修复 argparse 模块（或模块化一个库）
description: 最近在高强度投入 C++ Modules 相关的研究，发现一个很好的库叫 argparse，我为其模块部分的 bug 找到了一个解决方案。也可以作为 C++ 老代码模块化的典型案例。
pubDate: 2025-6-22
draft: false
---
## 0. 起因

前段时间发现了一个好东西，[Are We Modules Yet?](https://arewemodulesyet.org/)，这个网站跟踪记录了很多库以及它们的模块化进度。一边下定决心要在上面早日留下自己的库，一边发现了一个很好的库叫做 argparse。

它有多好呢？它在 23 年底就模块化了，而且有官方提供的 xmake.lua。

不过可惜的是，xmake-repo/argparse 既没有用到 argparse/xmake.lua，也没有提供模块支持。

所以，我出手了。

![所以，我出手了](/res/posts/fix-argparse-module/black_swam.png)

## -1. 更久之前

实际上四个月前我就发现了，并且给出了[一个 workround](https://github.com/KeqingMoe/argparse-module)，但它很丑，而且不方便，只能留着自己用。

适逢 [FTXUI 也模块化](https://github.com/ArthurSonzogni/FTXUI/pull/1015)了，而且手上有个马上开工的项目也要用到 argparse，我兴奋地决定给 argparse 也开开刀。

## 1. 利用 argparse/xmake.lua

第一步是先把 argparse/xmake.lua 利用起来。

我先开了一个本地包，把 xmake-repo/argparse/xmake.lua 复制过来：

```lua
package("argparse")
    set_kind("library", {headeronly = true})
    set_homepage("https://github.com/p-ranav/argparse")
    set_description("A single header argument parser for C++17")
    set_license("MIT")

    add_urls("https://github.com/p-ranav/argparse/archive/refs/tags/v$(version).zip",
             "https://github.com/p-ranav/argparse.git")
    add_versions("3.2", "14c1a0e975d6877dfeaf52a1e79e54f70169a847e29c7e13aa7fe68a3d0ecbf1")
    add_versions("3.1", "3e5a59ab7688dcd1f918bc92051a10564113d4f36c3bbed3ef596c25e519a062")
    add_versions("3.0", "674e724c2702f0bfef1619161815257a407e1babce30d908327729fba6ce4124")
    add_versions("2.6", "ce4e58d527b83679bdcc4adfa852af7ec9df16b76c11637823ef642cb02d2618")
    add_versions("2.7", "58cf098fd195895aeb9b9120d96f1e310994b2f44d72934c438ec91bf2191f46")
    add_versions("2.8", "9381b9ec2bdd2a350d1a0bf96d631969e3fda0cf2696e284d1359b5ee4ebb465")
    add_versions("2.9", "55396ae05d9deb8030b8ad9babf096be9c35652d5822d8321021bcabb25f4b72")

    on_install(function (package)
        os.cp("include/argparse/argparse.hpp", package:installdir("include/argparse"))
    end)

    on_test(function (package)
        assert(package:check_cxxsnippets({test = [[
            void test() {
                argparse::ArgumentParser test("test");
            }
        ]]}, {configs = {languages = "c++17"}, includes = "argparse/argparse.hpp"}))
    end)
```

首先呢因为模块化之后它不再是一个 headeronly 了，所以我们先把 `set_kind` 那里的 `, {headeronly = true}` 删了。也可能更好的做法是判断一下 config（在后文），现在先不管先了。

然后我们去翻阅一下 argparse/xmake.lua：

```lua
set_xmakever("2.8.2")
set_project("argparse")

set_version("3.2.0", { build = "%Y%m%d%H%M" })

option("enable_module")
option("enable_std_import", { defines = "ARGPARSE_MODULE_USE_STD_MODULE" })
option("enable_tests")
option("enable_samples")

add_cxxflags(
    "-Wall",
    "-Wno-long-long",
    "-pedantic",
    "-Wsign-conversion",
    "-Wshadow",
    "-Wconversion",
    { toolsets = { "clang", "gcc" } }
)
add_cxxflags("cl::/W4")

if is_plat("windows") then
    add_defines("_CRT_SECURE_NO_WARNINGS")
end

target("argparse", function()
    set_languages("c++17")
    set_kind("headeronly")
    if get_config("enable_module") then
        set_languages("c++20")
        set_kind("static") -- static atm because of a XMake bug, headeronly doesn't generate package module metadata
    end

    add_options("enable_std_import")

    add_includedirs("include", { public = true })
    add_headerfiles("include/argparse/argparse.hpp")
    if get_config("enable_module") then
        add_files("module/argparse.cppm", { install = true })
    end
end)

-- 后面用于测试的部分省略了
```

注意到核心在于 `enable_module` 和 `enable_std_import` 这两个选项。查阅 [xmake 文档](https://xmake.io/#/zh-cn/manual/configuration_option?id=%E5%AE%9A%E4%B9%89%E9%80%89%E9%A1%B9)可知它是通过构建命令的选项控制的。

查阅[文档](https://xmake.io/#/zh-cn/manual/package_instance?id=packageconfig)可知，当制作包时我们可以用 configs 来让外界传递参数，对应的我们在本地包中加上一些东西：

```lua
package("argparse")
    set_kind("library")
    set_homepage("https://github.com/p-ranav/argparse")
    set_description("A single header argument parser for C++17")
    set_license("MIT")

    add_configs("enable_module", { default = false, type = "boolean" })
    add_configs("enable_std_import", { default = false, type = "boolean" })

    -- ...
```

继续查阅 [xmake 文档](https://xmake.io/#/zh-cn/manual/package_dependencies?id=xmake) 可以找到利用 xmake.lua 的办法，也就是 `import("package.tools.xmake").install(package)`，而且还能传递一个第二参数来作为构建选项：

```lua
import("package.tools.xmake").install(package, {
    "--enable_module=ENABLE_MODULE",
    "--enable_std_import=ENABLE_STD_IMPORT"
})
```

不过，我们继续翻阅[文档](https://xmake.io/#/zh-cn/package/local_package?id=%e7%94%9f%e6%88%90%e8%bf%9c%e7%a8%8b%e5%8c%85)，可以看到另一种更好的做法。直接修改 `on_install` 部分：

```lua
    on_install(function (package)
        local configs = {}
        if package:config("enable_module") then
            configs.enable_module = "ENABLE_MODULE"
        end
        if package:config("enable_std_import") then
            configs.enable_std_import = "ENABLE_STD_IMPORT"
        end
        import("package.tools.xmake").install(package, configs)
    end)
```

本地包的 xmake.lua 的修改到此为止。测试的部分我不知道怎么改，`check_cxxsnippets` 似乎不能与模块一起运作。

然而，当我们在项目的 xmake.lua 中写下

```lua
add_requires("local-repo third_party")
add_requires("argparse", {
    configs = {
        enable_module = true, 
        enable_std_import = true
    }
})
```

时，发现根本跑不起来😡

## 2. 一路修到发电站

实际上是上游 argparse/xmake.lua 写错了。

修改 `target` 部分即可：

```lua
target("argparse", function()
    -- ...

    -- add_options("enable_std_import")
    if get_config("enable_std_import") then -- option 用错了，改成这个
        add_defines("ARGPARSE_MODULE_USE_STD_MODULE")
    end

    add_includedirs("include", { public = true })
    add_headerfiles("include/argparse/argparse.hpp")
    add_headerfiles("include/(argparse/argparse.hpp)") -- 加一行这个，不然会炸找不到头文件
    if get_config("enable_module") then
        add_files("module/argparse.cppm", { public = true, install = true }) -- 加个 public，xmake 文档里面也说了
    end
end)
```

中间那个 `add_headerfiles("include/(argparse/argparse.hpp)")` 是我控制变量试了一万次得出的结论，两个 `add_headerfiles` 一个都不能少。顺便吐槽一下，argparse 里面的 wrapper cppm 用的是 `argparse/argparse.hpp`，测试用的又是 `argparse.hpp`，搞得很混乱，不然也没这么多麻烦事情。

本地测试了一下，完美通过。

## 3. 后续处理

然后我给 argparse 发了个 [PR](https://github.com/p-ranav/argparse/pull/406)，等合并之后我会给 xmake-repo 也发一个 PR。不过这库五个月没有动静了，前段时间的 Issue 和 PR 似乎也没有被处理，如果等不来合并可以先用[我自用的 xmake-repo](https://github.com/KeqingMoe/xmake-repo) 顶着。

```lua
add_repositories("keqingmoe-repo https://github.com/KeqingMoe/xmake-repo.git")
add_requires("argparse fix-xmake-modules", {
    configs = {
        enable_module = true,
        enable_std_import = true
    }
})
```

不要忘记在 `target` 中使用 `add_packages` 哦🤩

## 4. 尾声

实际上我摸索的过程远比上面写的更曲折。感觉就是 xmake 其实挺难用的，只是对于 C++ 的其他所有构建系统或包管理器相对好用一些。

最后也希望 Modules 尽快普及吧！回头研究下 FTXUI，这里面也有一段故事（
