// types
type Identity = {
  name: string
  email: string
  avatar: string
}
type Version = string
type Page = {
  name: string
  path?: string
  src?: string
  indexed?: boolean
  children?: Array<Page>
}
type PagePathname = string

// config
export default {
  identity: {
    name: 'Cardinal',
    email: 'privatesky@axiologic.net',
    avatar: '__TODO__'
  } as Identity,
  version: '1.0.0' as Version,
  pages: [
    {
      name: 'Homepage',
      path: '/',
      src: 'index.html'
    }
  ] as Array<Page>,
  pagesPathname: 'pages' as PagePathname
}
