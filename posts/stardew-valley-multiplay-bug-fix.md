---
title: 星露谷联机 bug “这个角色属于另一位玩家” 解决方案
---

## 0. 发现问题

前几天联机的时候发现了一个 bug : 联机后的第二天再次联机时，无法选择之前创建的角色，会弹出 **“这个角色属于另一位玩家”** 的提示（当时是拍屏，就不放图了）

## 1. 解决方案

首先，打开你的存档所在的目录：

1. Windows 下，打开目录 `C:\Users\你的用户名\AppData\Roaming\StardewValley\Saves` ；或者按下 `Win+R` ，输入 `%appdata%\StardewValley\Saves` 然后回车。
2. Linux 或 MacOS 下，打开你的系统的对应的文件浏览器，前往目录 `~/.config/StardewValley/Saves` ；或者在打开位于你的当前用户的目录下的 `.config/StardewValley/Saves` 。

打开你的存档文件夹（其名字一般是你的存档名 + 一个下划线 + 一串数字），找到那个和文件夹名字一样的文件（不是 `SaveGameInfo` ，也不以 `_old` 结尾），编辑它（可以使用 VS Code ，也可以用记事本）。

按 `Ctrl+F` ，输入 `userID` ，找到类似这样的内容：

![](/res/posts/stardew-valley-multiplay-bug-fix/0.png)

将这一段**整体**替换成 `<userID />`。

然后寻找下一处，把所有这种带数字的都替换掉。替换完全部后，保存，重开游戏，解决。

这种解决方案并不稳定，根据网上信息似乎有概率复现（尽管我只用一次就解决了），更强大的解决方案见下一小节：

## 2. 终极方案

写了个程序（仅限 Windows，其他平台懒得搞交叉编译了）自动解决这个问题：

<!-- - [exe 下载 (站内)](https://keqing.moe/res/StardewValleyFix.exe "站内下载") -->
- [exe 下载 (Github)](https://github.com/KeqingMoe/StardewValleyFix/releases/download/1/StardewValleyFix.exe "exe 下载 (Github)")

### 源码解析

获取当前用户的工作路径：

```cpp
inline std::string homedir()
{
    return std::getenv("USERPROFILE");
}
```

扫描存档文件夹的所有存档：

```cpp
const std::regex findreg(R"(^(?!SaveGameInfo)(?!.*(_old|\.vdf|\.bak)$).+$)");

inline auto find(auto path)
{
    namespace fs=std::filesystem;
    std::vector<fs::path> results;
    for (const fs::directory_entry& dir_entry :
            fs::recursive_directory_iterator(path))
    {
        if(!dir_entry.is_regular_file())
            continue;
        if(!std::regex_match(dir_entry.path().filename().string(),findreg))
            continue;
        results.emplace_back(dir_entry.path());
    }
    return results;
}
```

修复存档：
```cpp
const std::regex fixreg(R"(<userID>\d*</userID>)");

inline auto fix(auto path)
{
    namespace fs=std::filesystem;
    auto bak_path=std::format("{}.bak",path.string());
    fs::copy_file(path,bak_path,fs::copy_options::overwrite_existing);

    auto fin=std::ifstream{bak_path};
    std::istreambuf_iterator<char> beg{fin}, end{};
    auto content=std::string{beg,end};

    auto fout=std::ofstream{path};
    auto it=std::ostreambuf_iterator<char>{fout};

    std::regex_replace(it,content.begin(),content.end(),fixreg,"<userID />");
}
```

`main` 函数：

```cpp
auto home_path=homedir();
auto saves_path=format(R"({}\AppData\Roaming\StardewValley\Saves)",home_path);
auto saves=find(saves_path);
for(auto&& save:saves){
    fix(save);
}
```

在这里找到全部的源代码： [Github Repo](https://github.com/KeqingMoe/StardewValleyFix "Github Repo")
