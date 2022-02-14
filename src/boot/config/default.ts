import type {
  Identity,
  Page,
  FallbackPage,
  LogLevel,
  DocsSource
} from './types';

export default {
  identity: {
    name: 'WebCardinal',
    email: '',
    avatar: '',
  } as Identity,
  pagesFallback: {
    name: '404'
  } as FallbackPage,
  pages: [
    {
      name: 'Homepage',
      path: '/',
      src: 'home.html',
    },
  ] as Page[],
  logLevel: 'error' as LogLevel,
  version: '1.0.0' as string,
  docsSource: 'github' as DocsSource,
  translations: true as boolean,
  skin: 'default' as string,
};
