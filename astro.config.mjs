import { defineConfig } from 'astro/config';
import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';

import rehypeAutolinkHeadings from 'rehype-autolink-headings';

// https://astro.build/config
export default defineConfig({
  integrations: [
    mdx(),
  ],
  markdown: {
    rehypePlugins: [rehypeHeadingIds, [rehypeAutolinkHeadings, {
      behaviour: 'append',
      content: {
        type: 'text',
        value: '#',
      },
      properties: {
        className: 'anchor-link',
      },
    }]],
    shikiConfig: {
      // Choose from Shiki's built-in themes (or add your own)
      // https://github.com/shikijs/shiki/blob/main/docs/themes.md
      theme: 'light-plus',
      // Enable word wrap to prevent horizontal scrolling
      wrap: true,
    },
  },
  outDir: '.docs',
  srcDir: './docs',
});
