import type {
  Identity,
  Version,
  Page,
  PagesPathname,
  SkinsPathname,
  LogLevel,
  DocsSource
} from './types';

export default {
  identity: {
    name: 'WebCardinal',
    email: 'privatesky@axiologic.net',
    avatar: '',
  } as Identity,
  pages: [
    {
      name: 'Homepage',
      path: '/',
      src: 'home.html',
    },
  ] as Page[],
  pagesPathname: 'pages' as PagesPathname,
  skinsPathname: 'skins' as SkinsPathname,
  logLevel: 'error' as LogLevel,
  version: '1.0.0' as Version,
  docsSource: 'github' as DocsSource,
  enableTranslations: false as Boolean
};
