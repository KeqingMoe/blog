---
title: 星露谷联机 bug “这个角色属于另一位玩家” 解决方案
description: 这篇文章提供了一个关于星露谷物语联机模式中出现的“这个角色属于另一位玩家”bug的解决方案。文章提供了两种解决方案：一种是手动编辑存档文件来解决，另一种是使用作者编写的程序自动修复存档。文章还包含了修复程序的源代码和下载链接。
pubDate: 2024-07-25
updatedDate: 2026-03-28
draft: false
---
## 0. 发现问题

前几天联机的时候发现了一个 bug : 联机后的第二天再次联机时，无法选择之前创建的角色，会弹出 **“这个角色属于另一位玩家”** 的提示（当时是拍屏，就不放图了）

## 1. 解决方案

根据你的系统，打开对应目录：

- Windows: `C:\Users\你的用户名\AppData\Roaming\StardewValley\Saves`
- macOS: `~/.config/StardewValley/Saves`

打开你的存档所在的文件夹，找到那个和文件夹名字一样的文件（不是 `SaveGameInfo` ，也不以 `_old` 结尾），编辑它（可以使用 VS Code ，也可以用记事本）。

按 `Ctrl+F` ，输入 `userID` ，找到类似这样的内容：

> 因文章迁移，图片已丢失，之后有机会补上吧

将这一段**整体**替换成 `<userID />`。

然后寻找下一处，把所有这种带数字的都替换掉。替换完全部后，保存，重开游戏，解决。

这种解决方案并不稳定，似乎有概率复现，更强大的解决方案见下一小节：

## 2. 终极方案

写了个程序自动解决这个问题：

- [exe 下载 (站内)](https://keqing.moe/res/StardewValleyFix.exe "站内下载")
- [exe 下载 (Github)](https://github.com/KeqingMoe/StardewValleyFix/releases/download/1/StardewValleyFix.exe "exe 下载 (Github)")

在这里找到全部的源代码： [Github Repo](https://github.com/KeqingMoe/StardewValleyFix "Github Repo")
