export type Identity = {
  name: string
  email: string
  avatar: string
}

export type Version = string

export type Page = {
  name: string
  path?: string
  src?: string
  indexed?: boolean
  children?: Array<Page>
}

export type PagesPathname = string

export type SkinsPathname = string

export type LogLevel = 'none' | 'warn' | 'error'
