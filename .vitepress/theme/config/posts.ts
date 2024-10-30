import { Iro } from "./types.mts";

/**
 * VitePress 主题 Sakurairo 的配置文件
 */
export default [
    {
        title: '年仅 3 美元！搭建你自己的邮件服务器',
        url: '/posts/3-usd-annually-personal-email-server',
        thumb: '/res/posts/3-usd-annually-personal-email-server/0.png',
        date: '2024-10-4',
        description: '本文介绍了作者因需求增长而搭建个人邮件服务器的经过。作者购买了年费仅 3 美元的 Bytevirt 的 Email Hosting 服务，通过支付宝支付并配置 DNS ，使用控制面板设置邮箱账号。此外，作者还分享了在 VPS 上安装 Roundcube 服务，并利创建反向代理的技巧。'
    }, {
        title: '星露谷联机 bug “这个角色属于另一位玩家” 解决方案',
        url: '/posts/stardew-valley-multiplay-bug-fix',
        date: '2024-7-25',
        description: '这篇文章提供了一个关于星露谷物语联机模式中出现的“这个角色属于另一位玩家”bug 的解决方案。文章提供了两种解决方案：一种是手动编辑存档文件来解决，另一种是使用作者编写的程序自动修复存档。文章还包含了修复程序的源代码和下载链接。'
    }, {
        title: 'Nekoray 4 + Hysteria2 + 端口跳跃 + TUN 模式无法联网的解决方案',
        url: '/posts/nekoray4-hysteria2-tun-port-hopping-solution',
        date: '2024-7-17',
        description: '本文讨论了在使用 Hysteria2 节点和 Nekoray 软件时遇到的网络连接问题。作者发现电信 QoS 导致数据传输受阻，且 v2rayN 不支持端口跳跃。通过实验和日志分析，作者发现 Nekoray 在开启端口跳跃时无法使用 TUN 模式。最终解决方案是让 Nekoray 负责端口跳跃，而 v2rayN 负责 TUN 模式，通过连接 Nekoray 的 SOCKS/HTTP 代理实现正常联网。'
    }
] satisfies Iro.Post[];