import {
  Identity,
  Version,
  Page,
  PagePathname,
  LogLevel
} from './types';

export default {
  identity: {
    name: 'WebCardinal',
    email: 'privatesky@axiologic.net',
    avatar: ''
  } as Identity,
  version: '1.0.0' as Version,
  pages: [
    {
      name: 'Homepage',
      path: '/',
      src: 'index.html'
    }
  ] as Array<Page>,
  pagesPathname: 'pages' as PagePathname,
  logLevel: 'error' as LogLevel
}
