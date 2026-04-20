---
title: 协程基础
description: 介绍一些基本的统一协程理论，并延伸一些高级内容
pubDate: 2025-10-15
draft: false
---

当我们说到协程的时候，我们到底在说什么？不如先从 `goto` 讲起吧。

## 从 `goto` 到 Continuation

尽管还原论常常被 *Considered Harmful*，我还是要讲一讲这背后的历史。

Dijkstra 提出，“Go To Statement Considered Harmful”。大致原理是，如果 `goto` 跳转到一个并不支配[^1]当前基本块的基本块，就会导致控制流图不可归约[^2][^3]。人脑或许能凭借直觉分析不可归约的流图，但对编译器[^4]来说则困难得多。不过，编译原理并不是本文的主题，所以笔者并不打算深入浅出地展开讲讲，有兴趣的读者可以自行研究，笔者也在脚注处附上了一些参考资料。

如今，**结构化编程**已经成为大部分人的共识，**结构化**的思想已经从控制流推广到到生命周期[^5]和并发等领域。但我想要从 `goto` 中延伸一些东西出来——**Continuation**[^6]。计算机科学家们正是用了 Continuation 及其衍生物，从与结构化编程的另一个完全不同的角度否定了 `goto`。

## Continuation 的前世今生

早在 1941 年，Continuation 的概念就被人理解了。那年，Church 在他的著作《The Calculi of Lambda-Conversion》中，使用纯 Lambda 演算定义了 **Church 计数**。这被认为是 Continuation 第一次被使用。不过，给 Continuation 真正下定义的人还在后头。

在上个世纪 60 年代，Algol 58 / 60 从 Fortran 中继承了 `goto`。反对 `goto` 的 Dijkstra...吗？不，这次是他的老板——Adriaan van Wijngaarden。van Wijngaarden 在 1964 年发表了一篇关于 Algol 60 预处理器公式化的论文《Recursive Definition of Syntax and Semantics》，论文中提出并倡导：存在一种方法能够把程序中的 `goto` 全部经过变换得到一些**高阶函数**[^7]，从而消除所有的 `goto`[^8]。这个高阶函数就是 **Continuation**，得到的新的“东西”被称作 **Continuation-Passing Style**，这种变换就是 **Continuation-Pass Style 变换**，简称 **CPS 变换**。

所以，究竟**什么是 Continuation？**

### 什么是 Continuation？

简单地说，Continuation 就是程序剩余的部分。

例如，对于表达式 $ 11 + 45 \times (14 - 1919) + 810 $，按照计算规则，我们应该先计算 $ 14 - 1919 = -1905 $，这时候原式剩下没算完的部分就是：

$$
11 + 45 \times \square + 810
$$

这便是 Continuation 了。同样的，抽出 $ 45 \times \square $，我们又得到了：

$$
11 + \square + 810
$$

然后抽出 $ 11 + \square $，我们得到：

$$
\square + 810
$$

不妨令

$$
c_0 = 14 - 1919 \\
c_1 = 45 \times \square \\
c_2 = 11 + \square \\
c_3 = \square + 810
$$

从而有：

$$
c_3 \ c_2 \ c_1 \ c_0 = 11 + 45 \times (14 - 1919) + 810
$$

这里更接近 Lambda 演算了，我们并不需要一对圆括号就能表示一个“函数调用”，$ c_3 \ c_2 \ c_1 \ c_0 $ 等价于 $ c_3(c_2(c_1(c_0))) $。而且不难发现我们就算在 $ c_3 \ c_2 \ c_1 \ c_0 $ 中任意地加上括号，也不会影响最终结果：

$$
\begin{aligned}
  & c_3 \ c_2 \ c_1 \ c_0 \\
= & (c_3 \ c_2 \ c_1) \ c_0 \\
= & ((c_3 \ c_2) \ c_1) \ c_0 \\
= & (c_3 \ c_2) \ c_1 \ c_0 \\
= & c_3 \ (c_2 \ c_1) \ c_0 \\
= & \cdots
\end{aligned}
$$

这是因为 Lambda 演算具有合流性[^9]，这意味着求值顺序不会影响求值结果的正确性（换句话说，我们可以任意地进行 $ \beta $ 归约）。然而在原本的代数式中可不是这样，我们就是要严格按照先乘除后加减、括号优先的顺序来算。这是因为，Continuation 的序列本身就已经编码了原始代数式的求值顺序了，$ \beta $ 归约的顺序并不不重要。

### CPS 变换

如果一个函数，它额外接受一个外部传入的 Continuation，并且执行完毕后不是返回一个值，而是把值**传递给这个 Continuation**，则我们称之为 Continuation-Passing Style。

我们不妨用一些代码解释。下面是一个用于计算范数的函数：

```pseudocode
norm: fn (x: Int, y: Int) -> Int = {
  sqx := x * x;
  sqy := y * y;
  res := sqx + sqy;
  res
}
```

CPS 变换之后，我们就得到了：

```pseudocode
Continuation: type = (Int) -> Never;

cps_add: fn (x: Int, y: Int, k: Continuation) -> Never = {
  k(x + y)
}

cps_mul: fn (x: Int, y: Int, k: Continuation) -> Never = {
  k(x * y)
}

cps_norm: fn (x: Int, y: Int, k: Continuation) -> Never = {
  c0: fn (res: Int) -> Never = {
    k(res)
  }
  c1: fn (sqy: Int) -> Never = {
    cps_add(sqx, sqy, c0)
  }
  c2: fn (sqx: Int) -> Never = {
    cps_mul(y, y, c1)
  }
  cps_mul(x, x, c2)
}
```

上面的 `cps_norm` 中我把闭包全都拆开了。用更 inline 的方式写就是：

```pseudocode
cps_norm: fn (x: Int, y: Int, k: Continuation) -> Never = {
  cps_mul(x, x, fn(sqx: Int) -> Never = {
    cps_mul(y, y, fn(sqy: Int) -> Never = {
      cps_add(sqx, sqy, fn(res: Int) -> Never = {
        k(res)
      })
    })
  })
}
```

其中返回类型为 `Never` 就表示这个函数**永远不会返回**。Continuation 的调用是**有去无回**的，比起函数调用，它更像一种高级的 `goto`。

其实实际上就是在原本的函数形参后面追加一个 Continuation，然后原本的返回值不再返回，而是传递给 Continuation。CPS 变换得到了我们之前说的高阶函数，如果原始函数返回 `Ret`，那么这个高阶函数额外接受的 Continuation 参数的类型就是 `(Ret) -> Never`。形式化地说就是：

```pseudocode
cps_transform: <(Args...) -> Ret> type = 
  (Args..., (Ret) -> Never) -> Never;
```

用更**类型论**一点的写法[^10]就是：

$$
\mathrm{CPST} \llbracket T \to U \rrbracket = T \times (U \to \bot) \to \bot
$$

如果你不熟悉类型论，可以暂时忽略这个公式，只需看看代码即可。

那么，我们该如何调用 `cps_norm` 呢？对于下面这个函数：

```pseudocode
println: fn (n: Int) -> ();

f: fn () -> () = {
  n := norm(114, 514);
  println(n);
}
```

我们对 `f` 和 `println` 也做一个 CPS 变换：

```pseudocode
cps_println: fn (n: Int, k: () -> Never) -> Never;

cps_f: fn (k: () -> Never) -> Never {
  cps_norm(114, 514, fn (n: Int) -> Never = {
    cps_println(n, k)
  })
}
```

不难发现，经过 CPS 变换后，所有函数的返回类型都是 `Never`。

请稍等！返回类型为 `Never` 意味着这次调用是一个**有去无回**的过程。从而，我们可以优化成**尾调用**[^11]... 而 CPS 中所有函数的返回类型都是 `Never`... 也就是全部都能优化成尾调用...

尾调用意味着，**调用栈深度不会增加**... 全部都是尾调用，则意味着整个程序生命周期内**调用栈深度保持不变**——调用栈如同**不存在**！

### 重新认识调用栈

那么，我们过去所理解的调用栈究竟是什么？如果它在这种范式下“消失”了，那它的本质又是什么？

众所周知，调用栈可以用于存放**返回地址**、函数实参、局部变量等等[^12]。等下，返回地址，不就是 Continuation 吗？所以调用栈某种意义上其实就是串联起所有 Continuation 的一个链表罢了[^13]。

这样解释，可能确实有点因果倒置了，毕竟人类先发明了调用栈，才发明了 Continuation。但就像人们用皮亚诺定理证明 $ 1 + 1 = 2 $ 一样，用 Continuation 解释调用栈恰恰说明了 Continuation 不仅正确而且具有普适性。

这套精巧的机制，为我们制造了一种“**函数总会返回**”的幻觉。而 CPS 变换，通过将所有的返回都变为向下一个 Continuation 的“跳转”，彻底撕碎了这层幻觉，让我们得以窥见控制流最原始、最本质的模样——从一个 Continuation 到另一个 Continuation 的流转。

这也正是 `goto` 所试图达到的、却因缺乏纪律而陷入混乱的自由。

### Continuation 的分类

Continuation 与 Continuation 之间亦有不同。Continuation 上有两种性质：**可用次数**和**保存状态的范围**。

根据 Continuation 可以使用一次或者多次，我们将其分为 **One-Shot Continuation** 和 **Multi-Shot Continuation**。One-Shot Continuation 仅能使用一次，但实现起来比较简单；而 Multi-Shot Continuation 如同存档，可以反复回到存档点，但实现较为复杂，需要保存完整的执行状态。

根据 Continuation 保存状态的范围是否有界，可以将其分为 **Undelimited Continuation** 和 **Delimited Continuation**。Undelimited Continuation 捕获的是从当前点开始，**直到整个程序结束的所有计算**。

但 Undelimited Continuation 太强了不好用，而且很危险，我们并不需要捕获整个世界。Delimited Continuation 通过使用一对成对出现的 $ \mathrm{reset} $ 和 $ \mathrm{shift} $ 来为 Continuation 定界，解决了这个问题。对于

$$
\mathrm{reset}(11 + 45 \times \mathrm{shift}(14 - 1919)) + 810
$$

则得到的 Continuation 就是

$$
11 + 45 \times \square
$$

Continuation 的这两个维度是正交的，可以任意组合。

不过，这些并非本文要深度探讨的主题，所以只简略地一笔带过。读者可以自行查找相关资料学习。

## 从 Subroutine 到 Coroutine

Continuation 的发明和对调用栈的重新理解，为我们打开了一扇大门，让我们走出“主程序-子程序”的思维牢笼。CPS 变换虽然揭示了本质，但它却让代码嵌套、令人类难以阅读和维护。它更像是一种供编译器使用的中间表示，而非人类编程的友好范式。

但它的思想是革命性的：如果我们不执着于“调用-返回”的模型，而是直接操作这些 Continuation，是否能设计出更灵活、更高效的程序结构呢？而当这种洞察与上世纪 60 年代严酷的硬件限制相遇时，协程的诞生便成了必然。

时间回到 1958 年，这个问题的答案在当时严酷的硬件限制下被逼了出来。

彼时，Melvin Conway 正在为 COBOL 实现编译器[^14]。在那个年代，存储介质以磁带为主，不支持随机读写，必须按顺序读写。而当时的内存普遍仅有 8000 ~ 16000 字节（顺带一提那时候一个字节是 6 Bits），没办法把整个磁带的内容都装进去，从而使用传统方法的编译器不可能**单趟编译**。

另一个阻碍是，当时的程序设计模式对编译器实现非常不友好。编译器的各个模块（如词法分析、语法分析）之间存在着复杂的、双向的、有状态的交互。那时，人们一般只把纯函数称作函数，有副作用的函数被称之为 Subroutine（子程序）。传统的 Subroutine 模式写起来丑陋又混乱。

在这种情况下，Conway——如同戴着镣铐的舞者——发明了协程——一种可以**暂停执行**的函数，暂停后**保留**其 Continuation，然后调用另一个协程先前保存好的 Continuation，从而把控制流**切换**到另一个协程上。

具体来说，Conway 发明的是一种**对称协程**：词法分析器、语法分析器、语义分析器、代码生成器等各自是一个协程，没有主从关系。它们像**生产者**与**消费者**一样，在需要数据时暂停并切换到生产者，在产生足够多的数据后唤醒消费者。

Conway 去其 sub- 前缀，取代表**协作**的 co- 前缀，**Coroutine**（**协程**）一词就此诞生。

1963 年，Conway 发表了第一篇关于协程的论文。1960–1980 年代，协程被广泛用于模拟、人工智能、并发编程、文本处理等领域。

然而事情并非总是一帆风顺。再往后，协程逐渐边缘化了。原因有三：

1. 缺少**统一的形式化定义**，不同语言对协程的实现差异很大
2. **First-Class Continuation**[^15] 具有更形式化的语义，被认为表达能力更强
3. **多线程**成为并发编程的主流模型

直到 2009 年，一篇名为《**Revisiting Coroutine**》[^16]的论文，被发表在 *ACM Transactions on Programming Languages and Systems* 上。论文主张**重新启用**协程作为**一种通用、强大且易于理解的控制抽象机制**，并提出了一个新的协程分类方法，引入了“**完整非对称协程**”的概念，并通过操作语义给出了精确定义。

## 统一协程理论

其实并没有“统一协程理论”这个词，这只是笔者生造的概念，并且一定程度上参考了《Revisiting Coroutine》中的协程理论。但笔者觉得这个词确实很贴切。

协程是**可暂停执行**的函数，是普通函数的**泛化**。所有的普通函数都是不会暂停的协程。

### 协程的分类

协程上可以抽象出三种性质，分别是：**控制流转移机制**、**地位**、**内存模型**。依照这三种性质，我们可以为协程分类。

#### 控制流转移机制

按控制流转移的机制，可以分为**对称协程**和**非对称协程**。

- 对称协程：每个协程之间是**平等**的，使用单一操作转移控制权
- 非对称协程：协程之间存在**主从关系**，被调用者只能将控制权还给调用者

反直觉的是，**对称协程和非对称协程的表达力是等价的**。

对于对称协程，如果我们在转移控制权的时候**记录主从关系**的信息，并且只转移回调用者，就能模拟非对称协程。例如，对称协程 `A` 调用了对称协程 `B`，记录了 `A  B` 的关系并将控制权转移给 `B`。`B` 执行完毕后，它有能力转移给任何协程，但我们强制要求它转移回 `A`。这就模拟了非对称协程的效果。

对于非对称协程，我们可以引入一个协程作为**调度器**中介，它是其他所有协程的调用者，协程挂起时，控制权转移给调度器，再由调度器去恢复另一个协程。例如，设调度器为 `D`，现在启动协程 `A`，由调度器把控制权转移给 `A`，然后 `A` 启动协程 `B`，挂起，将控制权返还调度器，再由调度器恢复协程 `B`。

在论文中，作者通过**操作语义**的形式化模型证明了这种模拟的正确性。他们定义了语言 $ \lambda_{sym} $（对称协程）和 $ \lambda_a $（非对称协程），并展示了如何将 $ \lambda_{sym} $ 程序翻译为 $ \lambda_a $ 程序，反之亦然，并证明翻译后的程序在语义上等价。

非对称协程记录的主从关系，其实是一种**结构化**的信息。这种信息量带来的强可组合性，大大降低了非对称协程对调度器的依赖。实际上，两类协程都不是绝对需要调度器才能运行，但对称协程没有维护结构化信息，手动控制 Continuation 会导致程序逻辑混乱、难以维护。而非对称协程的主从关系从某种意义上就是一种**隐式**的调度器，从而可以完全脱离调度器独立运行。

这也是为什么主流语言大多数都优先选择了非对称协程，因为它**控制流清晰**、**可组合性强**、**更易懂易用**，而且更契合**结构化编程**的思想。

论文的作者也更推崇非对称协程：

> Although equivalent in terms of expressiveness, symmetric and asymmetric coroutines are not equivalent with respect to ease of use. Handling and understanding the control flow of a program that employs even a moderate number of symmetric coroutines transferring control among themselves may require considerable effort from a programmer. On the other hand, since asymmetric coroutines always transfer control back to their invokers, control sequencing is much simpler to manage and understand. The composable behavior of asymmetric coroutines also provides support for concise implementations of several useful control behaviors, including generators, goal-oriented programming, and multitasking environments, as we will show in Section 4. Although implementing these control behaviors with symmetric coroutines is also possible, it complicates considerably the structure of programs.
>
> 尽管在表达能力上是对等的，但对称协程和非对称协程在易用性方面并不等同。对于一个使用了哪怕数量不多的、彼此间相互传递控制权的对称协程的程序，程序员在处理和理解其控制流时可能需要付出相当大的努力。另一方面，由于非对称协程总是将控制权交回给其调用者，因此控制序列的管理和理解要简单得多。正如我们将在第 4 节中展示的那样，非对称协程的可组合行为也为多种实用控制行为的简洁实现提供了支持，包括生成器、面向目标的编程以及多任务环境。尽管使用对称协程来实现这些控制行为也是可能的，但这会极大地使程序结构复杂化。

#### 地位

协程的地位指的是协程是否是一等公民[^15]。例如 Go 的协程（俗称 Goroutine）是受限协程，只能在特殊的语法结构中使用。其他现代语言的协程大多都是一等协程，可以作为值传递、存储、调用。但人们往往不需要手动操作协程对象，因而这一维度常常被忽略，在别的文章中读者大概只能是看不到这一点的。

#### 内存模型

在原论文中，这一性质被描述为“是否支持**栈式挂起**“。笔者认为应该这种定义较难理解，因此将其改为“内存模型”。这里的内存模型与并发编程无关，而是指协程挂起时用何种方式保存其上下文和 Continuation。

协程的内存模型大致可以分为**有栈**和**无栈**两种。

- 有栈协程：每个创建一个协程都分配一段独立的调用栈
- 无栈协程：所有协程与普通函数共用同一个调用栈

我们约定一些符号用于表示调用栈：用字母表示函数，从左到右排列表示调用栈从底到顶（如 `f g` 表示 `f` 调用了 `g`）。

对于有栈协程，挂起的时候只需要切换到另一个调用栈即可。我们以对称有栈协程为例，初始时：

```plaintext
f g
```

现在 `g` 启动了协程 `h`，则同时存在多个调用栈：

```plaintext
  f g
> h
```

我们用 `>` 标记当前所在的调用栈（一行）。然后 `h` 调用了 `i`，`i` 调用了 `j`，`j` 调用了 `k`，`k` 再启动了协程 `l`，`l` 再调用了 `m`，`m` 再调用了 `n`：

```plaintext
  f g
  h i j k
> l m n
```

现在，`n` 挂起，假设切换到了 `g`：

```plaintext
> f g
  h i j k
  l m n
```

`l` `m` `n` 都不受影响，我们换一个调用栈即可。`n` 挂起时，相当于 `n` 所在的整个调用栈都被挂起了，这被那篇论文称作“**栈式挂起**”。不难注意到，我们说“启动了协程”，“调用了函数”，但即便是普通函数，也**有能力直接挂起**。也就是说，对于使用对称有栈协程的模型，普通函数和协程具有相同的挂起能力，也就没有必要区分普通函数和协程。由前面对称性的结论得，这一点对于非对称有栈协程也成立。

结论：有栈协程可以在任意深度挂起。

无栈协程较为复杂。所有函数和协程共用一个调用栈。我们多加一个写法，函数后面可以有一对方括号，里面的符号代表它定义的变量。考虑非对称无栈协程：

```plaintext
f g[x] h
```

现在 `h` 挂起，控制流切换给 `g`：

```plaintext
f g[x] h[y] g[z]
```

对、对、对吗？函数活动记录 `g` 被 `h` 切成了两半。那么问题来了，切成两半的函数活动记录该如何使用？`g` 如何访问 `x`？`g` 实际上没有办法确定它的两段身体被分割了多远，谁知道 `h` 做了什么呢？如果我们想要栈式挂起，可能调用栈呈现出来是这样：

```plaintext
f g[x] h[y] i j k l m g[z]
```

而且，随着协程不断切换，会被越切越碎，切成越来越多段。所以我们得到**推论 1**：函数活动记录必须保持**连续**。

回到初始情况吧：

```plaintext
f g[x] h[y]
```

`h` 挂起，控制流切换给 `g`，则我们必须把调用栈上的 `h` 清理掉：

```plaintext
f g[x, z]
```

这样就对了。对、对、对吗？`y` 被清理了，但我们只是把 `h` 挂起了，不是 `h` 执行完了，早晚有一天我们还要回到 `f` 继续执行，直到 `h` 寿终正寝。所以我们应该把 `y` 找个地方存起来。调用栈上是不行了，我们必须在某处分配一块内存，然后把 `h` 持有的东西全部移动过去：

```plaintext
f g[x, &k, z]
---
k = h[y]
```

`g` 还需持有这块内存，以供之后恢复。我们得到**推论 2**：有一些东西在挂起时不能被清理，要么**一开始就放在不会被清理的地方**，要么在挂起时被挪动到不会被清理的地方。我们更倾向于前者，后者曾在协程发展早期出现过，后来逐渐式微。

这块保存了挂起时不会被清理的数据的结构就叫做**协程帧**，也就是 Continuation。它一般存放了协程参数、**生命周期跨越挂起点的局部变量**、协程的其他状态量等。调用者通过协程帧的句柄来恢复该协程的执行。同时，这种协程等价于状态机，并且编译器往往也会将其编译为状态机。

这个地方在哪里？它必须保证整个协程的生命周期内不能被销毁。显然，我们可以动态分配一块内存。

是否存在一种代价更小的方法去找到这个地方？调用栈上真的不能放吗？能！观察不难得出，若**协程的生命周期严格嵌入调用者的生命周期**，则协程帧可以存放于调用者处，从而免去额外的动态分配：

```plaintext
f g[x, k = h[y], z] h[&k]
```

无栈协程能否进行栈式挂起？观察如下的调用栈：

```plaintext
f g h i
```

我们能否由 `i` 处跨越 `h` 挂起 `g`？不能，因为 `i` 既无法感知 `g` `h` 的函数活动记录结构、也没有所有权。但我们可以先挂起 `i`，再挂起 `h`，再挂起 `g`。从而这条挂起路径上所有函数必须都是协程。**推论 4**：无栈协程会导致**函数染色**[^17]。

所以，栈式挂起的代价是函数染色？但栈式挂起的定义是在任意深度一次挂起，而函数染色后，其实是经过了多次挂起，每次退出一层，所以我们不会称之为栈式挂起。**推论 5**：**无栈协程不支持栈式挂起**。

**推论 6**：是 / 否支持栈式挂起与有栈 / 无栈协程互为**充要条件**。留待读者自证。

由前面对称性的结论得，这一点对于对称无栈协程也成立。但我们一般很少讨论无栈协程的对称性，笔者认为原因是对称无栈协程的**结构性劣于非对称无栈协程**、**复杂度高于对称无栈协程**，并且对称协程和非对称协程可以互相归约。在接下来的章节中，笔者会介绍现实中存在的对称无栈协程。

#### 完全协程

论文指出，**一等有栈协程属于完全协程**，并进一步区分**对称完全协程**和**非对称完全协程**。

论文中主张，非对称完全协程更具有实用性，因为其控制流更清晰。并且，论文还论证了，完整协程的表达力等价于 One-Shot Continuation 或 One-Shot Delimited Continuation。

### 协程与线程

若读者先前了解过协程，尤其是了解过“绿色线程”“用户级线程”等概念，或者看过协程和线程的对比，到此一定会发出这样的疑惑：你介绍的协程，为什么和我的认知差别这么大？为什么一点也不曾提及线程？

原因是，协程本身就只是可暂停的函数罢了，它要不要调度器都无所谓，是不是跑在多线程上也无所谓。换言之，协程和线程本就是**正交**的关系，或者说没什么关系，完全可以自由组合。

## lang-spec 协程

在此，我将介绍一些语言的协程实现方法。

### Rust

笔者对 Rust 并不算懂，只能简略介绍。

Rust 语言提供 `async` / `await` 原语。

一些前置：

```rust
enum Poll<T> {
    Ready(T),
    Pending,
}

trait Future {
    type Output;
    fn poll(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<Self::Output>;
}
```

假设有：

```rust
async fn f() -> T {
    // ...
}
```

则 `f()` 得到一个 `impl Future<Output = i32>`。通过对 Future 的轮询，我们可以逐步推进协程的状态。在协程结束之前，`poll` 总是返回 `Pending`，结束时则返回 `Ready(T)`。

现在我们假设：

```rust
async fn g() {
    let num = 0;
    let ptr = &num;
    
    let x = f().await;
    // ...
}
```

`num` 和 `ptr` 跨越挂起点，因此需要放在协程帧内：

```rust
struct TheFuture<'a> {
    num: i32,
    ptr: &'a i32,
}
```

这里于是产生了一个**自引用**：`ptr` 引用了 `num`。

这就会导致，如果我们将 `TheFuture` 移动到其他内存位置，则 `ptr` 依然指向原来的内存位置。因此，**自引用类型不能移动**。

我对 Rust 了解有限，并不清楚 Rust 准备以何种方式解决所有自引用问题。不过，`async` / `await` 不需要稳定自引用特性作为前置，因为 `TheFuture` 是编译器生成的，用户不用操心初始化问题，也无法读取其字段，只需防止意外移动即可。Rust 的解决方案是 `Pin`，通过 `Pin` 禁止移动。`poll` 的 `self: Pin<&mut Self>` 实现了这一点。

此外，Rust 的协程都是 Lazy 的，这意味着在第一次 `poll` 之前，协程帧上只初始化了参数等，而没有初始化局部变量。此时不存在自引用，暂时还能移动。

Rust 协程模型的控制流较为简单，且对内存的控制具有更细的粒度。

### C++

在 C++ 中，并不存在这个问题。因为 C++ 的协程原语在内存方面粒度过粗，无法由使用者自行控制。一般来说启动一个协程会动态分配一个协程帧，若编译器可以证明该协程的生命周期严格嵌入调用者的生命周期，则允许优化掉动态分配。

C++ 的协程不需要 `async` 关键词，同时，引入了 `co_await` / `co_yield` / `co_return`，函数中出现三者之一则表明这是一个协程。协程的返回类型必须有一个 `promise_type` 成员类型。`promise_type` 用于定义一类协程的行为。这么做的好处是，我们可以通过定制 `promise_type` 来定制高级控制流，而坏处则是无法利用自动推导返回值的功能。

```cpp
struct task {
  struct promise_type {
    // ...
  };
};
auto coro() -> task {
  // ...
  co_return /* expr */;
}
```

编译器会为止自动生成大量代码。创建协程的流程大概如下：

1. 创建协程帧
2. 在协程帧里构建 `promise_type` 对象，记为 `promise`
3. 把协程的参数移动到协程帧里
4. 调用 `promise.get_return_object()` 返回给调用者一个 `task` 对象

随后，`co_await promise.initial_suspend()`。

一次 `co_await expr` 的流程则是：

1. 检查能否 `promise.await_transform(expr)`，若能则调用并将返回值存为 `awaitable`，否则 `awaitable` 为 `expr` 自身
2. 依次检查 `awaitable` 是否存在成员 `operator co_await` 或非成员版，若有则调用并将返回值存为 `awaiter`，否则 `awaiter` 为 `awaitable` 自身
3. 调用 `awaiter.await_ready()`，若为 `true`，则跳到 8，否则继续下一步
4. 构造 `handle = std::coroutine_handle<promise_type>::from_promise(promise)`
5. 保存协程状态，等待恢复。之后协程被视为已挂起
6. 若 `awaiter.await_suspend(handle)` 返回 `void` 或 `bool` 且为 `true`，则返还控制权给调用者。若为 `false`，继续下一步
7. 恢复协程状态
8. 调用 `awaiter.await_resume()` 作为 `co_await` 表达式的结果

协程支持库还提供了两个类型：`std::suspend_never` 和 `std::suspend_always`。对前者 `co_await` 则永不挂起，后者则相反。

`promise_type::initial_suspend()` 常常返回 `std::suspend_never` 和 `std::suspend_always` 中的一个，从而决定初始时是挂起还是恢复。初始挂起则为惰性，类似 Rust 协程。

随后，正常执行函数体。

最后，执行 `co_await promise.final_suspend()`。然后 `co_return expr` 会被转换为 `promise.return_value(expr)`，`co_return` 会被转换为 `promise.return_void()`。这个名字不同的设计也是令人比较迷惑的，加之 `void` 类型是不完整类型，C++ 类型系统的缺陷逐渐显露出来。

关于 `co_yield expr`，它会被转换为 `co_await promise.yield_value(expr)`。

由此可见 C++ 协程的微言大义。其大量的定制点使得开发者可以定制**高级的控制流**，后续章节有一些相关的库。但同时，标准库设施的缺失也使得其上手难度较高。

注意到，尽管我们能选择初始不挂起，但 C++ 协程的**设计缺陷**导致我们几乎必然要初始挂起[^18]，因为只有在 `co_await` 处才有机会获取 `coroutine_handle`。而很多情况下我们必须拿到 `coroutine_handle` 才能操作，例如 IO 库，如果我们没有拿到 `coroutine_handle` 就发起 IO 操作，就要实现复杂的稍后获得 `coroutine_handle` 然后提交给挂入系统 IO 回调队列的回调函数“的逻辑，复杂且存在并发和数据竞争问题。

Gor Nishanov 的提案[P0913R0 Add symmetric coroutine control transfer](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2018/p0913r0.html)，为 C++ 协程带来了**对称转移**[^19]：通过提供一种允许一种不需要消耗任何额外栈空间的前提下，让一个协程挂起时对称恢复另一个协程的能力。

具体来说，该提案做了两件事：

1. 允许 `promise_type::await_suspend()` 返回 `std::coroutine_handle<T>`，这会将控制权对称地转移到该句柄代表到协程
2. 新增 `std::noop_coroutine` 函数，返回 `std::noop_coroutine_handle`，在对称转移时可以将控制权转移给调用者，也就是挂起

这可以被认为是一种对称无栈协程。

### 其他语言

笔者对其他语言的了解程度有限。不过可以推荐一篇文章：[Traversing nested lists with coroutines, Rosetta Code style](https://wks.github.io/blog/2022/09/22/coroutine-flatten.html)，它同时也展示了有栈协程和无栈协程的区别。

## 展望未来

从另一种角度来看，（非对称）协程可以作为高级控制流，我们可以用它实现很多高级控制流。

### Parser Combinator

Parser Combinator（解析器组合子）是与 Parser Generator 相对的概念，指的是具有可组合性的解析器。我们可以把小型甚至是原语 Parser Combinator 自由组合成更大的 Parser Combinator，甚至还能引入一些 Parser Generator 难以引入的复杂逻辑。[^20]

而如果结合 Parser Combinator 的表达力和协程的高级控制流......总之就是非常爽。可以参考 [no-more-secrets/parsco](https://github.com/no-more-secrets/parsco) 以及[笔者的一个编译器项目](https://github.com/AutoLang-Dev/autofront-legacy/blob/main/autofront/parse.cppm)（已废弃，转向使用 Rust 重构）。

### 代数效应

代数效应（Algebraic Effects，简称 AE）是一种很 Geek 的东西。据我所知工业语言中仅有 OCaml 提供了基于有栈协程的语言级支持，而学术语言中可以研究下专为 AE 而生的 Koka（こうか、効果）语言。

粗略来说，AE 就像一种可以恢复的异常[^21]：

```pseudocode
DivByZero: effect () -> Int;

div: fn (x: Int, y: Int) -> Int ! DivByZero = {
  if y == 0 {
    DivByZero()
  } else {
    x / y
  }
}

main: fn () -> () = {
  try {
    z := div(1, 0);
    std::println(f"1 / 0 = {z}");
  } catch DivByZero() {
    resume 114514;
  }
}

// 可能的输出：
// 1 / 0 = 114514
```

准确来说，AE 应该要叫做代数式副作用，因为我们可以用它隔离函数中的副作用——只需抛出所有副作用即可：

```pseudocode
// FFI，非纯函数
println: (first: *Byte, last: *Byte) -> ();

Print: effect (msg: std::StrView) -> () = {
  // 顶层效应处理器
  println(
    msg.Range::begin().raw(),
    msg.Range::end().raw(),
  )
}

// 下面两个都是纯函数

do_sth: fn () -> () ! Print = {
  for i in 0..<10 {
    Print(f"{i}")
  }
}

main: fn () -> () ! Print = {
  Print("main() begin");
  do_sth();
  Print("main() end")
}
```

AE 太棒了，它能统一协程、异步、异常、依赖注入等特性。

基于 One-Shot Continuation 的 AE 我们称之为 One-Shot AE，论文《[One-shot Algebraic Effects as Coroutines](https://www.logic.cs.tsukuba.ac.jp/~sat/pdf/tfp2020.pdf)》证明了其等价于协程。

论文《[ワンショット代数的効果から非対称コルーチンへの変換](https://www.logic.cs.tsukuba.ac.jp/~sat/pdf/pro2019-01.pdf)》中给出了将 One-Shot AE 转为非对称有栈协程（Lua）的办法。该论文还指出：

> 本研究で対象とした非対称コルーチンは関数呼び出しをまたいで中断することができる stackful コルーチンである。その一方で，関数呼び出しをまたぐことのできない stackless コルーチンを持つ JavaScript 言語による代数的効果の実装もおこなわれている [^22]。このライブラリは，本研究で実装した [^22] に基づいて実装されている。関数もコルーチンにし，関数呼び出しを yield でおこなうことでエフェクトによるコントロールの移動を実現している。この方法を用いることで，stackless コルーチンを持つ言語にも本研究の成果が適用できるようになることが期待できる。
>
> 在本研究中作为对象的非对称协程，是一种能够栈式挂起的有栈协程。另一方面，基于拥有无法栈式挂起的无栈协程的 JavaScript 语言，也实现了代数效应[^22]。该库是在本研究实现的[^22]的基础上构建的。通过将函数也作为协程处理，并利用 `yield` 进行函数调用，从而实现了通过效应来控制程序流程。采用这种方法，有望使本研究成果也能适用于拥有无栈协程的编程语言。

此外，不难注意到，AE 等价协程的生命周期总是严格嵌入被调用者，从而我们可以无需动态分配就能实现 AE。笔者手上也有一个 PL 项目有朝着 AE 发展的计划，正是上面的论文和推论，使得笔者有勇气和决心做一个零开销的 AE。

### 函数染色

其实，无论是协程的染色还是 AE 的染色，其实际上代表的是来自类型系统的保障，并且染色比不染色可以解决更多问题，我们应该拥抱它。而 Java Checked Exception 的染色被人诟病的原因还是推导能力不够强。

确实有不染色的 AE 实现，可惜对不上笔者的胃口。

---

[^1]: [支配树 - OI Wiki](https://oi-wiki.org/graph/dominator-tree/)
[^2]: [流图的可归约性 - 山楂片的博客](https://szp15.com/post/testing-flow-graph-reducibility/)
[^3]: [A Program Data Flow Analysis Procedure - A.M. Turing Award](https://amturing.acm.org/p137-allen.pdf)
[^4]: [LLVM 浅谈 12：loop - 知乎](https://zhuanlan.zhihu.com/p/594132961)
[^5]: 结构化生命周期即所谓的 RAII。
[^6]: [Continuation - Wikipedia](https://zh.wikipedia.org/wiki/%E7%BB%AD%E4%BD%93)
[^7]: 高阶函数指的是接受函数作为参数或者返回函数的函数。
[^8]: [什么是「Continuation」？ - 圆角骑士魔理沙的回答 - 知乎](https://www.zhihu.com/question/61222322/answer/564847803)
[^9]: [合流性 - 香蕉空间](https://www.bananaspace.org/wiki/%E5%90%88%E6%B5%81%E6%80%A7)
[^10]: [底类型 - Wikipedia](https://en.wikipedia.org/wiki/Bottom_type)
[^11]: [尾调用优化 - 阮一峰的网络日志](https://ruanyifeng.com/blog/2015/04/tail-call.html)
[^12]: [调用栈 - Wikipedia](https://zh.wikipedia.org/wiki/%E5%91%BC%E5%8F%AB%E5%A0%86%E7%96%8A)
[^13]: [Continuation·傻瓜函数式编程·看云](https://www.kancloud.cn/kancloud/functional-programm-for-rest/56928)
[^14]: [Conway[1963]](https://melconway.com/Home/pdf/compiler.pdf)
[^15]: [什么是一等公民](https://habens.github.io/blog/first-class-citizens/)
[^16]: [Revisiting Coroutine](https://dl.acm.org/doi/pdf/10.1145/1462166.1462167)
[^17]: [What Color is Your Function?](https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/)
[^18]: [协程与重叠 IO - microcai - 知乎](https://zhuanlan.zhihu.com/p/7424498247)
[^19]: [C++ 协程 4 理解对称转移 - z217's blog](https://z217blog.cn/post/c++%E5%8D%8F%E7%A8%8B4%E7%90%86%E8%A7%A3%E5%AF%B9%E7%A7%B0%E8%BD%AC%E7%A7%BB/)
[^20]: [Parser Combinator](https://zhiruili.github.io/posts/parser-combinator/)
[^21]: [函数式编程中的 algebraic effects 是什么？ - 酱紫君的回答 - 知乎](https://www.zhihu.com/question/300095154/answer/2625852587)
[^22]: [eff.js - One-Shot Algebric Effects on JavaScript Generators](https://github.com/MakeNowJust/eff.js)
