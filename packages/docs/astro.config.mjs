// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      customCss: [
        // Relative path to your custom CSS file
        './src/styles/custom.css',
      ],
      favicon: '/assets/favicon.svg',
      sidebar: [
        {
          items: [
            {
              label: 'Installation',
              slug: 'guides/installation',
            },
            {
              label: 'Usage',
              slug: 'guides/usage',
            },
          ],
          label: 'Guides',
        },
        {
          items: [
            {
              label: 'Playback',
              slug: 'demos/playback',
            },
            {
              label: 'Captions',
              slug: 'demos/captions',
            },
            {
              label: 'Chapters',
              slug: 'demos/chapters',
            },
            {
              label: 'Layout',
              slug: 'demos/layout',
            },
            {
              label: 'Live states',
              slug: 'demos/live',
            },
            {
              label: 'Playback Rates',
              slug: 'demos/playback-rates',
            },
            {
              label: 'Volume',
              slug: 'demos/volume',
            },
          ],
          label: 'Demos',
        },
        {
          items: [
            {
              label: 'Usage',
              slug: 'legacy/usage',
            },
            {
              label: 'Migration Guide',
              slug: 'legacy/migration',
            },
          ],
          label: 'V2.0 (Legacy)',
        },
        {
          items: [
            {
              label: 'Integration with Qumu Widgets',
              slug: 'recipes/qumu-widgets',
            },
          ],
          label: 'Recipes',
        },
      ],
      title: 'Qumu',
    }),
  ],
});
