type SidebarBlock = {
  pages: Array<{
    link: string;
    text: string;
  }>;
  title: string;
};

export const IFRAME_URL = 'https://pbaron.qumu.dev/view/jXaJBD3dhPrK7UqEQpSjzZ';

export const SIDEBAR: SidebarBlock[] = [
  {
    pages: [
      {
        link: '/installation',
        text: 'Installation',
      },
      {
        link: '/usage',
        text: 'Usage',
      },
    ],
    title: 'General',
  },
  {
    pages: [
      {
        link: '/demos/playback',
        text: 'Playback',
      },
      {
        link: '/demos/captions',
        text: 'Captions',
      },
      {
        link: '/demos/chapters',
        text: 'Chapters',
      },
      {
        link: '/demos/layout',
        text: 'Layout',
      },
      {
        link: '/demos/live',
        text: 'Live states',
      },
      {
        link: '/demos/playback-rates',
        text: 'Playback Rates',
      },
      {
        link: '/demos/volume',
        text: 'Volume',
      },
    ],
    title: 'Demos',
  },
  {
    pages: [
      {
        link: '/legacy/usage',
        text: 'Usage',
      },
      {
        link: '/legacy/migration',
        text: 'Migration guide',
      },
    ],
    title: 'Legacy',
  },
];
