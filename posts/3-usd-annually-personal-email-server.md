---
title: 年仅 3 美元！搭建你自己的邮件服务器
---

## 0. 前情提要

Namesilo 的邮件转发功能已经满足不了我日渐增长的{需求:野心}，于是我开始试图自己搭建邮件服务器，无奈我用的 VPS 服务商一巴掌拍死所有25端口。

昨天机缘巧合发现 bytevirt 提供 **$3 USD** 每年的邮件服务器(Email Hosting Service 3GB)，提供 3GB 存储空间，可以创建无限的邮箱，仔细盘算还是挺值的，遂购买后水一篇文章。

## 1. 购买

前往 [Bytevirt](https://bytevirt.com/store/special-offers) ，在 **Special Offers** 那一类找到 **Email Hosting Service 3GB** :

![Email Hosting Service 3GB](/res/posts/3-usd-annually-personal-email-server/0.png)

它是限量的，我购买时很幸运地刚好剩最后一份，但是过了半天就补了 9 份。如果你购买时无货，可以蹲蹲补货。

点击 **立即订购** ，按要求填写你的域名和你的个人信息，随后付款，可以使用支付宝。在付款后就会为你创建一个账号。

检查你的邮箱，当你收到来自 Bytevirt 的带有 **Control Panel** 字样的邮件时，你已经完成购买了。

## 2. 配置 DNS

打开那封邮件里面的 **Control Panel Login URL** ，按它给的用户名和密码登录后，点开 **账号设置 > DNS 管理** （设置里可以改简体中文）。

![Bytevirt Mail Control Panel](/res/posts/3-usd-annually-personal-email-server/1.png)

把它给的这些 DNS 记录复制到向你提供 DNS 解析的服务商那边。但 NS 记录要改成 MX 记录，两条 MX 记录及也可以只写一条，记录值也可以写 `mail.bytevirt.com`，因为三个最后解析到都是 `94.130.135.140` 。

![Bytevirt Mail DNS](/res/posts/3-usd-annually-personal-email-server/2.png)

复制过去之后大概是这样的：

![Cloudflare](/res/posts/3-usd-annually-personal-email-server/3.png)

待 DNS 配置生效后，就可以使用 Bytevirt Mail 控制面板了。

## 3. 配置 Bytevirt Mail 控制面板

点开 **邮件管理器 > 邮箱账号** ，点击上方的 **<fa-i icon="fa-solid fa-plus"></fa-i> 创建账号** 。创建好了之后，点击你创建的邮箱旁边的 <fa-i icon="fa-solid fa-arrow-right-to-bracket"></fa-i>，就会打开 Bytevirt Mail 为你提供的 Webmail(基于 Roundcube) 功能。

此时你已经可以自由使用你的专属邮箱了。

## 4. 更进一步？

不妨在我自己的 VPS 上建立一个 Roundcube 服务吧。

我的 VPS 上使用了 1panel 面板，可以直接用 1panel 安装 Roundcube 。如果你不使用 1panel ，可以另寻他法。

搭建好 Roundcube 后，它会额外使用一个端口，使用起来既不好看，也不好记。不妨先解析一个二级域名，创建一个指向原域名的 CNAME 记录，再用 1panel 创建一个反向代理，使用 nginx 创建也可以。

这下舒服了。
