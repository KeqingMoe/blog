import { defineConfig } from "astro/config";
import mdx from '@astrojs/mdx';
import komorebi from "komorebi-theme";

import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: "https://keqing.moe",
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      [rehypeKatex, { strict: false }],
    ],
  },
  integrations: [
    mdx(),
    komorebi(),
  ],
});
