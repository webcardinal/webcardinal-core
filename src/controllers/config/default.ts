import type {
  Identity,
  Page,
  LogLevel,
  DocsSource,
  Skin
} from './types';

export default {
  identity: {
    name: 'WebCardinal',
    email: 'webcardinal@axiologic.net',
    avatar: '',
  } as Identity,
  pages: [
    {
      name: 'Homepage',
      path: '/',
      src: 'home.html',
    },
  ] as Page[],
  pagesPathname: 'pages' as string,
  skinsPathname: 'skins' as string,
  logLevel: 'error' as LogLevel,
  version: '1.0.0' as string,
  docsSource: 'github' as DocsSource,
  translations: false as boolean,
  skins: [
    {
      name: 'default'
    }
  ] as Skin[]
};
