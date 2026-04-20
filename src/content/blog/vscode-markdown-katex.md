---
title: 使 VSCode Markdown PDF 插件渲染 KaTeX 
description: VSCode 的插件 Markdown PDF 无法渲染 KaTeX，网上有流行的魔改方案但仅限于 LaTeX。这篇文章提供了一个适用于 KaTeX 的解决方案。
pubDate: 2025-4-6
draft: false
---
做离散数学作业的时候要打很多公式，VSCode 的插件 Markdown PDF 无法渲染数学公式，我因此受很多苦恼。在网上查询一番之后，找到了一些解决方案，是通过魔改插件下的 HTML 模板实现的 LaTeX 渲染，需要在插件的 `template/template.html` 中加入：

```html
<script type="text/javascript" src="http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
<script type="text/x-mathjax-config"> MathJax.Hub.Config({ tex2jax: {inlineMath: [['$', '$']]}, messageStyle: "none" });</script>
```

但它不适用于 KaTeX（尽管 VSCode 支持），所以我花了几个小时研究，找到了解决方案。

## 解决方案

打开插件目录下的 `template/template.html` ，具体地，它可能是 `C://Users/你的用户名/.vscode/extensions/yzane.markdown-pdf-版本号/template/template.html` 。然后在 `head` 中加入：

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.10.0-rc.1/dist/katex.min.css" integrity="sha384-D+9gmBxUQogRLqvARvNLmA9hS2x//eK1FhVb9PiU86gmcrBrJAQT8okdJ4LMp2uv" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.10.0-rc.1/dist/katex.min.js" integrity="sha384-483A6DwYfKeDa0Q52fJmxFXkcPCFfnXMoXblOkJ4JcA8zATN6Tm78UNL72AKk+0O" crossorigin="anonymous"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.10.0-rc.1/dist/contrib/auto-render.min.js" integrity="sha384-yACMu8JWxKzSp/C1YV86pzGiQ/l1YUfE8oPuahJQxzehAjEt2GiQuy/BIvl9KyeF" crossorigin="anonymous"></script>
<script>
  window.onload = () => {
    renderMathInElement(document.body, {
      delimiters: [
        {left: "$$", right: "$$", display: true},
        {left: "$", right: "$", display: false}
      ],
      macros: {
        "\\\n": "\\\\",
      }
    });
  };
</script>
```

保存即可。

在我当前的版本下，不能使用最新的 KaTeX，因为我用了一个宏（上面的 `"\\\n": "\\\\",` 那行），但这种宏似乎是非标准的，从而更新到最新版后无法正常渲染。我懒得找最后一个可以正常运作的版本了。而之所以要引入这个宏，其实也是因为 Markdown PDF 插件本身的问题，它会把 KaTeX 中用于换行的 `\\` 给转成 `\` ，所以我才引入了这么个宏来转回去。有点用魔法打败魔法的意味了，所以我也没法子去提 PR。

实际上[有人研究出了有更稳定的做法并发起了 PR](https://github.com/yzane/vscode-markdown-pdf/pull/386)，但出于某些原因未能被合并，但可以手动安装，可以去 GitHub 看看。
