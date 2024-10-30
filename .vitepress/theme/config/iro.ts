import { Iro } from "./types.mts";
import posts from "./posts";

/**
 * VitePress 主题 Sakurairo 的配置文件
 */
export default {
    title: "刻晴♡マイワイフ",
    titleTemplate: "刻晴♡マイワイフ",
    description: "🥰🥰🥰",
    favicon: '/res/favicon.png',
    cover: {
        avatar: '/res/avatar.png',
        signature: '心有所向，日复一日，必有精进',
        background: {
            random: true,
            desktop: 'https://t.alcy.cc/fj/',
            mobile: 'https://t.alcy.cc/mp/',
        }
    },
    nav: {
        icon: '/res/icon.png',
        links: [
            { title: '首页', url: '/' },
            { title: '源码', url: 'https://github.com/KeqingMoe/blog' },
        ]
    },
    search: {
        path: '/',
        param: 's',
    },
    social: {
        links: [
            {
                icon: 'github',
                link: 'https://github.com/KeqingMoe',
                name: 'GitHub'
            },
            {
                icon: 'tg',
                link: 'https://t.me/keqingmoe',
                name: 'Telegram'
            },
            {
                icon: 'mail',
                link: 'mailto:me@keqing.moe',
                name: 'E-mail'
            },
        ]
    },
    footer: {
        content: '<a href="https://icp.gov.moe/?keyword=20240904" target="_blank">萌ICP备20240904号</a> | <a href="https://nyaicp.xyz/?id=20241120" target="_blank">喵喵ICP备案 20241120号</a>'
    },
    style: {
        themeSkin: '#8e78c6',
        themeSkinMatching: '#5892eb',
        themeSkinDark: '#211a39',

        menuRadius: '10px',
        menuSelectionRadius: '10px',
    },
    posts: posts
} satisfies Iro.Config;
