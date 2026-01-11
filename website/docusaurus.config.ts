// website/docusaurus.config.js
const config = {
  title: 'jsql',
  tagline: 'Lightweight fluent SQL query builder for JavaScript',
  url: 'https://jsql-sandy.vercel.app',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',  // Add your favicon later in static/img

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',  // Docs at root URL
        },
        blog: false,  // Disable blog completely
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'jsql',
      items: [
        {
          href: 'https://github.com/razinshafayet/jsql',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://www.npmjs.com/package/@razinshafayet/jsql',
          label: 'npm',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/intro' },
          ],
        },
        {
          title: 'Links',
          items: [
            { label: 'GitHub', href: 'https://github.com/razinshafayet/jsql' },
            { label: 'npm', href: 'https://www.npmjs.com/package/@razinshafayet/jsql' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Razin Shafayet`,
    },
  },
};

module.exports = config;