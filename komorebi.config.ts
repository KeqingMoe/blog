import { defineConfig, type KomorebiFriend } from "komorebi-theme";

const friends: KomorebiFriend[] = [
  {
    name: "焦茶咖啡厅",
    description: "来和焦茶染香喝杯奶茶吗？",
    url: "https://tea.keqing.moe",
    avatar: "https://tea.keqing.moe/tea.png",
  },
  {
    name: "GamerNoTitle",
    description: "TECH OTAKAS SAVE THE WORLD",
    url: "https://bili33.top/",
    avatar: "https://assets.bili33.top/img/AboutMe/logo-mini.png",
  },
  {
    name: "雪碧",
    description: "只喝可乐",
    url: "https://blog.rimuruchan.tech/",
    avatar: "https://blog.rimuruchan.tech/images/favicon.jpg",
  },
  {
    name: "CZYの学习笔记",
    description: "CZYの学习笔记",
    url: "https://iamczy.com/",
    avatar: "https://z1.ax1x.com/2023/08/22/pPJ6geO.jpg",
  },
  {
    name: "Phrinky's Blog",
    description: "Ricky 的各种日常捏",
    url: "https://blog.rkk.moe/",
    avatar: "https://blog.rkk.moe/images/profile.webp",
  },
  {
    name: "酷丁的主页",
    description: "一个羞涩的小朋友的自我介绍页面",
    url: "https://cold04.com/",
    avatar: "https://cold04.com/src/avatar_480.webp",
  },
  {
    name: "Chenmyの小破站",
    description: "这是一只鸽子，只会咕咕叫",
    url: "https://blog.chenmyawa.top/",
    avatar: "https://blog.chenmyawa.top/avatar.jpg",
  },
  {
    name: "AdproのBlog",
    description: "Adpro的Blog，可能有有用的东西？",
    url: "https://blog.adproqwq.top/",
    avatar:
      "https://cdn.jsdelivr.net/gh/adproqwq/picx-images-hosting@master/avatar.3uusvva7na.jpg",
  },
  {
    name: "unknown's blog",
    description: "真正的大师，永远都怀着一颗学徒的心",
    url: "https://unk.org.cn/",
    avatar: "https://avatars.githubusercontent.com/u/112916014?v=4",
  },
  {
    name: "Je2em1ah's BLOG",
    description: "Rev 彩笔",
    url: "https://www.j3r3m14h.com.cn/Je2em1ah_blog/",
    avatar:
      "https://jeremiah.oss-cn-shenzhen.aliyuncs.com/picture/202501031542999.jpg",
  },
  {
    name: "Rusty_Blog",
    description: "Search Engines Enjoyer",
    url: "https://blog.rusty1e.top/",
    avatar: "https://blog.rusty1e.top/image/avatar.png",
  },
];

export default defineConfig({
  title: "時雨繋ぎ",
  friends,
  customCss: [
    "katex/dist/katex.min.css",
  ],
});
