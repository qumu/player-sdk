type SidebarBlock = {
  pages: Array<{
    link: string;
    text: string;
  }>;
  title: string;
};

export const IFRAME_URL = 'https://demo.qumucloud.com/view/player-sdk-example';

export const SIDEBAR: SidebarBlock[] = [
  {
    pages: [
      {
        link: `${import.meta.env.BASE_URL}installation`,
        text: 'Installation',
      },
      {
        link: `${import.meta.env.BASE_URL}usage`,
        text: 'Usage',
      },
      {
        link: `${import.meta.env.BASE_URL}integration`,
        text: 'Integration with Qumu Widgets',
      },
    ],
    title: 'General',
  },
  {
    pages: [
      {
        link: `${import.meta.env.BASE_URL}demos/playback`,
        text: 'Playback',
      },
      {
        link: `${import.meta.env.BASE_URL}demos/captions`,
        text: 'Captions',
      },
      {
        link: `${import.meta.env.BASE_URL}demos/chapters`,
        text: 'Chapters',
      },
      {
        link: `${import.meta.env.BASE_URL}demos/layout`,
        text: 'Layout',
      },
      {
        link: `${import.meta.env.BASE_URL}demos/live`,
        text: 'Live states',
      },
      {
        link: `${import.meta.env.BASE_URL}demos/playback-rates`,
        text: 'Playback Rates',
      },
      {
        link: `${import.meta.env.BASE_URL}demos/volume`,
        text: 'Volume',
      },
    ],
    title: 'Demos',
  },
  {
    pages: [
      {
        link: `${import.meta.env.BASE_URL}legacy/usage`,
        text: 'Usage',
      },
      {
        link: `${import.meta.env.BASE_URL}legacy/migration`,
        text: 'Migration guide',
      },
    ],
    title: 'v2.0 (Legacy)',
  },
];
