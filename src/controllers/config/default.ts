import {
  Identity,
  Version,
  Page,
  PagesPathname,
  SkinsPathname,
  LogLevel
} from './types';

export default {
  identity: {
    name: 'WebCardinal',
    email: 'privatesky@axiologic.net',
    avatar: ''
  } as Identity,
  pages: [
    {
      name: 'Homepage',
      path: '/',
      src: 'index.html'
    }
  ] as Array<Page>,
  pagesPathname: 'pages' as PagesPathname,
  skinsPathname: 'skins' as SkinsPathname,
  logLevel: 'error' as LogLevel,
  version: '1.0.0' as Version
}
