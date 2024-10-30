---
title: Nekoray 4 + Hysteria2 + 端口跳跃 + TUN 模式无法联网的解决方案
---

## 0. 前情提要

昨天我在连接 Hysteria2 节点时，它炸了，无论如何都没有数据传输。经过一番代价不小的排查，我得出结论：被电信 QoS 制裁了。

在加上端口跳跃后，我发现 v2rayN 不支持端口跳跃。换成 Nekoray 并按要求 [配置外部 Hysteria 核心](https://matsuridayo.github.io/n-extra_core/ "配置外部 Hysteria 核心") 后，同样打开 TUN 模式，却无法联网了。

## 1. 探索研究

通过实验和查看 [Nekoray 4.0-beta3 发行日志](https://github.com/MatsuriDayo/nekoray/releases/tag/4.0-beta3 "Nekoray 4.0-beta3 发行日志") ，我发现：Nekoray 打开端口跳跃时不使用 sing-box 而是外部 Hysteria 核心。关掉端口跳跃并使用 sing-box 后，TUN 模式是可以正常联网的。我又试了关掉端口跳跃，但是强制使用外部核心，此时 TUN 模式无法使用。

所以真正的问题其实是外部 Hysteria 核心无法使用 TUN 模式。

从而我们有：

- v2rayN TUN 模式可以使用，但不能端口跳跃
- Nekoray 打开端口跳跃后，不能使用 TUN 模式

## 2. 解决方案

于是我们可以让 Nekoray 负责端口跳跃， v2rayN 负责 TUN 模式。即： Nekoray 关闭 TUN 模式和系统代理，v2rayN 连接 Nekoray 的 SOCKS/HTTP 代理并打开 TUN 模式。